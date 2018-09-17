# -*- coding:utf8 -*-
import os,sys
import pandas as pd
import numpy as np

import json
import datetime
from Util import pretty_print,save_to_database,logger,config_logger
from anomaly_analysis_traffic import load_node_idx
from progress.bar import Bar

import itertools

node_idx_map={}

scenario_num=10
OUTPUT_PREFIX='/opt/disk/vis_sec/CTU13/CTU-13-Dataset/'+str(scenario_num)+'/output/'

#RESAMPLE_FREQ = '3T'
RESAMPLE_FREQ = 'T'
DB_TABLE_NAME='ctu13_anomaly_graph_'+str(scenario_num)+''
#TIME_SLIDING_WINDOW='1s'
TIME_SLIDING_WINDOW='60s'
TRAFFIC_EVENTS_PATH = OUTPUT_PREFIX+'anomaly_traffic_'+TIME_SLIDING_WINDOW+'_'+RESAMPLE_FREQ+'.json'

REDUCED_OUTPATH = OUTPUT_PREFIX+'reduced_anomaly_'+TIME_SLIDING_WINDOW+'_'+RESAMPLE_FREQ+'.json'
CORRELATION_OUTPATH = OUTPUT_PREFIX+'traffic_correlation_'+TIME_SLIDING_WINDOW+'_'+RESAMPLE_FREQ+'.json'

def translate_datetime_string_to_visual_time_format(timestamp):
    part1,part2 = timestamp.split()
    date = part1.split('-')[2]
    hour,minu,sec = part2.split(':')
    selected = [date,hour,minu,sec]
    return ':'.join(selected)

def correlation_to_visual_database(correlation_data):
    for anomaly_limit_a in np.arange(25,95,5):
        for anomaly_limit_b in np.arange(25,50,5):
	    anomaly_limit_a_percent = (anomaly_limit_a+0.0)/100
	    filtered_correlation_data = filter_vis_events(correlation_data,anomaly_limit_a_percent)
            save_to_database(DB_TABLE_NAME,filtered_correlation_data,'edge',anomaly_limit_a,anomaly_limit_b)
    print 'Done in saving edge anomalies into database'

def load_traffic_data():
    global node_idx_map
    path = TRAFFIC_EVENTS_PATH
    anomalies = json.load(open(path))
    return anomalies

def time_array_to_datetime(time_a):
    return datetime.datetime(2011,8,time_a[0],time_a[1],time_a[2],time_a[3])

def timelist_to_visual_time(time_list):
    return ':'.join([str(e) for e in time_list])

def get_unique_index_of_event(event):
    start_time = timelist_to_visual_time(event['T'][0])
    port = str(event['S'][1])
    return start_time+'_'+port

def get_time_array_from_event_index(event_index):
    return [int(e) for e in event_index.split('_')[0].split(':')]

def get_source_dest_mapping(data_map,direction):
    source2dest_map={}
    print 'get mapping between source and dest'
    bar = Bar('Loading', fill='@',suffix='%(percent)d%% %(avg).3fs seconds per loop', max=len(data_map))
    for source,event_list in data_map.items():
	dest_list=[]
	for sublist in [e['S'][3] for e in event_list]:
		dest_list+=sublist
	for ip in dest_list:
	    map_ip = 'Net_'+ip
	    if direction=='src':
	        source2dest_map[(source,map_ip)]=1    
	    elif direction=='dest':
	        source2dest_map[(map_ip,source)]=1    
	bar.next()
    bar.finish()
    return source2dest_map

def traffic_hosts_correlate(reduced_anomaly_list):
    print 'correlating traffic'
    global node_idx_map
    source_data_map = reduced_anomaly_list['source_host']
    dest_data_map = reduced_anomaly_list['dest_host']
    source_host_list = source_data_map.keys()
    dest_host_list = dest_data_map.keys()

    source2dest_map_s = get_source_dest_mapping(source_data_map,'src')
    source2dest_map_d = get_source_dest_mapping(dest_data_map,'dest')
    print 'source dict'
    print len(source2dest_map_s.keys())
    print 'dest dict'
    print len(source2dest_map_d.keys())

    data_map = list(set(source2dest_map_s.keys()) & set(source2dest_map_d.keys()))

    print len(data_map)

    bar = Bar('Loading', fill='@',suffix='%(percent)d%% %(avg).3fs seconds per loop', max=len(data_map))

    correlation_result=[]
    for host_a, host_b in data_map:
        if host_a == host_b:
	    bar.next()
            continue

	host_a_event_list = source_data_map[host_a]
	host_b_event_list = dest_data_map[host_b]

	host_a_ip = host_a.split('_')[1]
	host_b_ip = host_b.split('_')[1]
	logger.debug('host_a_ip: '+str(host_a_ip))
	logger.debug('host_b_ip: '+str(host_b_ip))

	events_with_b_in_a = [ e for e in host_a_event_list if (host_b_ip in e['S'][3])]
	events_with_a_in_b = [ e for e in host_b_event_list if (host_a_ip in e['S'][3])]

        #events_with_b_in_a.sort(key=lambda x: time_array_to_datetime(x['T']), reverse=False)
        #events_with_a_in_b.sort(key=lambda x: time_array_to_datetime(x['T']), reverse=False)
	time_begin_2_index_map_a={}
	time_begin_2_index_map_b={}
	for index, elem in enumerate(events_with_b_in_a):
	    time_begin_2_index_map_a[get_unique_index_of_event(elem)]=index    
	for index, elem in enumerate(events_with_a_in_b):
	    time_begin_2_index_map_b[get_unique_index_of_event(elem)]=index    

        time_port_b_in_a = set(time_begin_2_index_map_a.keys())
        time_port_a_in_b = set(time_begin_2_index_map_b.keys())

	x = [time_port_b_in_a,time_port_a_in_b]
	time_series_intersection = set.intersection(*x)

	logger.info(str(host_a_ip)+' -> '+str(host_b_ip))
	logger.info(str(time_port_b_in_a) +' <-> ' +str(time_port_a_in_b)+' intersection: '+str(time_series_intersection))

	data_genre='traffic'
	source_I = host_a_event_list[0]['I']
	target_I = 'TD_'+str(node_idx_map[host_b])

        time_series_intersection_list = list(time_series_intersection)
	time_series_intersection_list.sort(key=lambda x: time_array_to_datetime(get_time_array_from_event_index(x)), reverse=False)

	result = []
	for event_index in time_series_intersection_list:
		event_a = events_with_b_in_a[time_begin_2_index_map_a[event_index]]
		event_b = events_with_a_in_b[time_begin_2_index_map_b[event_index]]

        	source_visual_time = {'start':timelist_to_visual_time(event_a['T'][0]),'end':timelist_to_visual_time(event_a['T'][1])}
        	dest_visual_time = {'start':timelist_to_visual_time(event_b['T'][0]),'end':timelist_to_visual_time(event_b['T'][1])}

		pair_start_time = timelist_to_visual_time(event_b['T'][0])
		pair_end_time = timelist_to_visual_time(event_b['T'][1])

		sourceTI = event_a['TimeIndex']
		destTI = event_b['TimeIndex']

		result.append({'data_genre': data_genre,
				   'source': source_I,
				   'sourceTimeIndex': sourceTI,
				   'sourceTime':source_visual_time,
				   'target': target_I,
				   'targetTimeIndex': destTI,
				   'targetTime': dest_visual_time,
				   'temporalValue': 0,
				   'spatialValue': 0,
				   'categoricalValue': 0,
				   'weightAbsolute': max(event_a['A'],event_b['A']),
				   'weightRelative': min(event_a['A'],event_b['A']),
				   'TimeStart': pair_start_time, 
				   'TimeEnd': pair_end_time 
				   })

        correlation_record = {"source": source_I, \
                  "target": target_I, \
                  'EdgeType': data_genre, \
                  "timeSeries": result \
                  }
        correlation_result.append(correlation_record)
	bar.next()
    bar.finish()

    return correlation_result

def filter_vis_events(correlation_visual_record_list,score_limit):
    filtered_list=[]
    for anomaly_info in correlation_visual_record_list:
        filtered_event_series = []
        event_field_name = 'timeSeries'
        for event in anomaly_info[event_field_name]:
            #if event['weightAbsolute'] < score_limit:
            if event['weightRelative'] < score_limit:
                continue
            filtered_event_series.append(event)
        if len(filtered_event_series) == 0:
            continue

        field_name_list = ['source','target','EdgeType']
        copy_anomaly_info={}
        for name in field_name_list:
            copy_anomaly_info[name] = anomaly_info[name]
        copy_anomaly_info[event_field_name] = filtered_event_series

        filtered_list.append(copy_anomaly_info)
    return filtered_list

def preprocess_data(output_path):
    net_data = load_traffic_data()
    source_host_list = pd.unique([e['ID'] for e in net_data if e['C'][1] == 'src'])
    dest_host_list = pd.unique([e['ID'] for e in net_data if e['C'][1] == 'dest'])
    print len(source_host_list)
    print len(dest_host_list)

    source_data_map = {}
    dest_data_map = {}
    print 'reducing source host'
    bar = Bar('Loading', fill='@',suffix='%(percent)d%% %(avg).3fs seconds per loop', max=len(source_host_list))
    for src_host in source_host_list:
	event_list = [e for e in net_data if e['ID'] == src_host]
	source_data_map[src_host]=event_list
	bar.next()
    bar.finish()

    print 'reducing dest host'
    bar = Bar('Loading', fill='@',suffix='%(percent)d%% %(avg).3fs seconds per loop', max=len(dest_host_list))
    for host in dest_host_list:
	event_list = [e for e in net_data if e['ID'] == host]
	dest_data_map[host]=event_list
	bar.next()
    bar.finish()

    anomaly_reduced = {'source_host':source_data_map,'dest_host':dest_data_map}
    json.dump(anomaly_reduced,open(output_path,'w'),indent=4,sort_keys=True)
    return anomaly_reduced

def traffic_correlate():
    global node_idx_map
    path = TRAFFIC_EVENTS_PATH
    node_idx_map = load_node_idx(path)

    reduced_anomaly_list_filepath = REDUCED_OUTPATH
    if not os.path.exists(reduced_anomaly_list_filepath):
	reduced_anomaly_list = preprocess_data(reduced_anomaly_list_filepath)
    else:
	reduced_anomaly_list = json.load(open(reduced_anomaly_list_filepath))

    correlation_record_filepath = CORRELATION_OUTPATH
    if not os.path.exists(correlation_record_filepath):
    	correlation_visual_record_list = traffic_hosts_correlate(reduced_anomaly_list)
        json.dump(correlation_visual_record_list ,open(correlation_record_filepath,'w'),indent=4,sort_keys=True)
    else:
	correlation_visual_record_list = json.load(open(correlation_record_filepath))

    correlation_to_visual_database(correlation_visual_record_list)

def main():
    config_logger()
    traffic_correlate()
if __name__ == '__main__':
    main()
