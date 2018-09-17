# -*- coding:utf8 -*-
import os,sys
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
import math
import time
import datetime
from progress.bar import Bar
from collections import Counter

import scipy.stats
import json

from Util import time_string_remove_day,save_to_database,ip_is_whitelist,list_to_csv,append_list_to_csv
from visualize import visualize_histogram,scatter_vis
from ctu13_util import extract_ctu13_features,read_ctu13_data_chunk,read_ctu13_data

MODE=3
if MODE==1:
    output_prefix ='/opt/disk/vis_sec/vast2013_c3/output/'
    dataset_prefix ='/opt/disk/vis_sec/vast2013_c3/dataset/nf/'
    filename_list = ['week1_nf-chunk1.csv','week1_nf-chunk2.csv','week1_nf-chunk3.csv','nf-week2.csv']
    filename_list = [dataset_prefix+e for e in filename_list]
    GLOBAL_PARAMS = []
    label='vast2013'
    GLOBAL_PARAMS.append([output_prefix,filename_list,label])

    read_raw_data = read_vast13_data
    extract_raw_features = extract_vast13_features
elif MODE==2:
    output_prefix='/opt/disk/vis_sec/ugr16/output/'
    dataset_prefix='/opt/disk/vis_sec/ugr16/uniq/'
    filename_list = [dataset_prefix+'july.week5.csv.uniqblacklistremoved']
    label='ugr16'
    GLOBAL_PARAMS = []
    GLOBAL_PARAMS.append([output_prefix,filename_list,label])
    read_raw_data = read_ugr16_data_chunk
    extract_raw_features = extract_ugr16_features
elif MODE==3:
    PREFIX='/opt/disk/vis_sec/CTU13/CTU-13-Dataset/'
    #selected_file_list=[9,10,11,12]
    selected_file_list=[10]
    FILENAME_MAP = {1:'capture20110810.binetflow',\
		    2:'capture20110811.binetflow',\
		    3:'capture20110812.binetflow',\
		    4:'capture20110815.binetflow',\
		    5:'capture20110815-2.binetflow',\
		    6:'capture20110816.binetflow',\
		    7:'capture20110816-2.binetflow',\
		    8:'capture20110816-3.binetflow',\
		    9:'capture20110817.binetflow',\
		    10:'capture20110818.binetflow',\
		    11:'capture20110818-2.binetflow',\
		    12:'capture20110819.binetflow',\
		    13:'capture20110815-3.binetflow'}
    GLOBAL_PARAMS = []
    for num,filename in FILENAME_MAP.items():
	if num not in selected_file_list:
	    continue
        output_prefix=PREFIX+str(num)+'/output/'
        dataset_prefix=PREFIX+str(num)+'/'
        filename_list = [dataset_prefix+filename]
        label='ctu13_'+str(num)
	GLOBAL_PARAMS.append([output_prefix,filename_list,label])
    read_raw_data = read_ctu13_data_chunk
    read_raw_data_all = read_ctu13_data
    extract_raw_features = extract_ctu13_features

#TIME_SLIDING_WINDOW='3s'
TIME_SLIDING_WINDOW='60s'

WELLKNOWN_PORTS={'tcp':[25,80,6667],'udp':[161],'icmp':[]}

def extract_traffic_features_chunk(path,out_src_path,out_dest_path):
    #data = read_raw_data(path)
    chunksize = CHUNKSIZE
    chunk_count=0

    for chunk in read_raw_data(path,chunksize):
	#chunk.sort_index(inplace=True)
	print (str(chunk_count)+' chunk '+str(chunk.shape))
	chunk_src_list,chunk_dest_list = extract_traffic_features(chunk)
	chunk_count+=1

	append_list_to_csv(chunk_src_list,features_src_event_path)
	append_list_to_csv(chunk_dest_list,features_dest_event_path)

def extract_traffic_features_all(path,out_src_path,out_dest_path):
    data = read_raw_data_all(path)
    data.sort_index(inplace=True)
    for prot,port_list in WELLKNOWN_PORTS.items():
	print 'extracting feature for protocol '+prot
	if len(port_list) == 0:
		chunk_src_list,chunk_dest_list = extract_traffic_features(data,prot,'None')

		append_list_to_csv(chunk_src_list,out_src_path)
		append_list_to_csv(chunk_dest_list,out_dest_path)
	else:
		for port in port_list:
			print 'extracting feature for protocol '+prot+' port '+str(port)
			chunk_src_list,chunk_dest_list = extract_traffic_features(data,prot,port)

			append_list_to_csv(chunk_src_list,out_src_path)
			append_list_to_csv(chunk_dest_list,out_dest_path)

def extract_traffic_features(data,prot,port):
    begin_time = data.index[0].to_pydatetime()
    end_time = data.index[-1].to_pydatetime()
    print (begin_time)
    print (end_time)
    begin_time = begin_time.replace(second=0, microsecond=0)
    current_time = begin_time
    current_hour = current_time.hour

    ip_src_feature_list=[]
    ip_dest_feature_list=[]

    window_seconds = int(TIME_SLIDING_WINDOW[:-1])
    print ('interval in seconds: '+str(window_seconds))
    loop_count = ((end_time-current_time).seconds/window_seconds)
    if loop_count==0:
	loop_count=1
    bar = Bar('Loading', fill='@',suffix='%(percent)d%% %(avg).3fs seconds per loop', max=loop_count)
    while current_time <= end_time:
        next_time = current_time + pd.to_timedelta(TIME_SLIDING_WINDOW)
        t_data = data[(data.index>=current_time)&(data.index<next_time)]
        if t_data.shape[0]!=0:
            #port_scan_ip_list += detect_port_scan(t_data)
            #src_list,dest_list = extract_vast13_features(t_data)
            src_list,dest_list = extract_raw_features(current_time,t_data,prot,port)
            ip_src_feature_list += src_list
            ip_dest_feature_list += dest_list

        if current_time.hour != current_hour:
            print ('current time : '+str(current_time))
            current_hour = current_time.hour
        current_time = next_time
        bar.next()
    bar.finish()

    #for record in ip_src_feature_list:
    #    print ' '.join([str(e) for e in record])

    return ip_src_feature_list, ip_dest_feature_list

def main():
    global GLOBAL_PARAMS
    for i in range(len(GLOBAL_PARAMS)):
        OUTPUT_PREFIX = GLOBAL_PARAMS[i][0]
        data_path_list = GLOBAL_PARAMS[i][1]
	label = GLOBAL_PARAMS[i][2]

        features_src_event_path = OUTPUT_PREFIX+'feature_info_src_'+TIME_SLIDING_WINDOW+'.csv'
        features_dest_event_path = OUTPUT_PREFIX+'feature_info_dest_'+TIME_SLIDING_WINDOW+'.csv'
        overwrite=True
	if (not os.path.exists(features_src_event_path)) or overwrite:
	    print ('Extracting features to directory: '+OUTPUT_PREFIX)
	    for data_path in data_path_list:
	        extract_traffic_features_all(data_path,features_src_event_path,features_dest_event_path)
	else:
	    print ('File '+features_src_event_path+' found')

if __name__ == '__main__':
    main()
