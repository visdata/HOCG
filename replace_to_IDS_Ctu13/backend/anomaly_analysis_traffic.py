# -*- coding:utf8 -*-
import os,sys
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
import math
import time
import datetime
import traceback
from progress.bar import Bar
from collections import Counter

from itertools import compress

import scipy.stats
import json

from point_anomaly import outlier_detection_gmm,outlier_detection_svm,get_score_by_gaussian,get_score_by_gmm

from Util import time_string_remove_day,save_to_database,drop_database,ip_is_whitelist,append_list_to_csv,logger,config_logger,pretty_print,EVT_score_compute_by_vector,gmm_fit,get_EVT_score_from_p

from ctu13_util import read_groundtruth

from visualize import visualize_histogram,scatter_vis

scenario_num=10
OUTPUT_PREFIX='/opt/disk/vis_sec/CTU13/CTU-13-Dataset/'+str(scenario_num)+'/output/'
DB_TABLE_NAME='ctu13_anomaly_graph_'+str(scenario_num)+''
#OUTPUT_PREFIX='/Users/flyroom/research/vis_sec/output/'

#TIME_SLIDING_WINDOW='10s'
#TIME_SLIDING_WINDOW='60s'
TIME_SLIDING_WINDOW='60s'
#TIME_SLIDING_WINDOW='600s'

COL_NAMES=['NH','ANF','NF','ND','NB']
IGNORED_PROTO_FEATURE_LIST=[('icmp','ND'),('udp','ND')]

SRC_PATH = OUTPUT_PREFIX+'feature_info_src_'+TIME_SLIDING_WINDOW+'.csv'
DEST_PATH = OUTPUT_PREFIX+'feature_info_dest_'+TIME_SLIDING_WINDOW+'.csv'
SRC_GMM_PATH = OUTPUT_PREFIX+'gmm_src_'+TIME_SLIDING_WINDOW+'.json'
DEST_GMM_PATH = OUTPUT_PREFIX+'gmm_dst_'+TIME_SLIDING_WINDOW+'.json'

RESAMPLE_FREQ = 'T'
TIME_DELTA=datetime.timedelta(minutes=1)
#RESAMPLE_FREQ = 'H'

EVENTS_RAW_OUTPATH = OUTPUT_PREFIX+'anomaly_raw_'+TIME_SLIDING_WINDOW+'_'+RESAMPLE_FREQ+'.txt'
EVENTS_OUTPATH = OUTPUT_PREFIX+'anomaly_traffic_'+TIME_SLIDING_WINDOW+'_'+RESAMPLE_FREQ+'.json'
VIS_OUTPATH = OUTPUT_PREFIX+'vis_anomaly_traffic_'+TIME_SLIDING_WINDOW+'_'+RESAMPLE_FREQ+'.json'

NORMAL_START_DATE = datetime.datetime(2011,8,18,10,0,0)
NORMAL_END_DATE = datetime.datetime(2011,8,18,11,0,0)
NORMAL_SAMPLE_SIZE = (NORMAL_END_DATE - NORMAL_START_DATE).seconds
print 'Normal period last for '+str(NORMAL_SAMPLE_SIZE)+' seconds'

DATA_TYPE ='traffic'

node_id_2_index_map={}

FILTER_SOURCE_IP_LIST=['122.226.12.150',\
			#3389 rdp
		       '124.232.153.174',\
			#1433 mssql
		       '60.174.174.107',\
			#1433 mssql
		       '211.155.231.207',\
			#80 suspicious flow
		       '147.32.84.138',\
			# udp53 frequent dns request
		       '70.37.110.238',\
			# 3128 proxy
		       '202.75.211.206',\
			# 80
		       '89.235.6.106',\
			# 443 port scan
		       '147.32.84.174',\
			]

REMOVE_PROT_PORT_LIST=['tcp:25']

spam_attacker,spam_victims,cf_attacker,cf_victims,irc_clients,irc_servers = read_groundtruth()
attacker_victim_all = list(spam_attacker.keys()+irc_clients.keys()+irc_servers.keys())

def agg_multi_func(input_array):
    max_array = input_array
    if input_array.shape[0]>1:
	if input_array.shape[0] != 2:
	    print input_array
	    print input_array.shape
	    raise
	max_array = input_array.loc[input_array.anomaly_score.idxmax()]
    return max_array

def traffic_event_reform(path):
    data = read_anomaly_data(path)

    anomaly_info_list=[]
    unique_prot_list = list(set(data.prot))
    for prot in unique_prot_list:
	print 'reforming '+prot
        prot_data = data[data.prot==prot]
        unique_attack_channel = list(set(zip(prot_data.ip ,prot_data.dest_port)))
        bar = Bar('Loading', fill='@',suffix='%(percent)d%% %(avg).3fs', max=len(unique_attack_channel))
        print 'number of unique attack channels '+str(len(unique_attack_channel))
	for ip,dest_port in unique_attack_channel:
		logger.debug(ip + ' : '+prot+' -> '+str(dest_port))
		ip_data = prot_data[(prot_data.ip==ip)&(prot_data.dest_port==dest_port)]
		if ip_data.shape[0]==0:
			logger.error('weird emtpy ip_data')
			raise
		#ip_data = ip_data.resample(RESAMPLE_FREQ,on='time').apply(aggregate_func)
	        ip_data.groupby(pd.Grouper(freq='1Min',key='time')).apply(agg_multi_func)	
		#ip_data = ip_data[ip_data['raw_values'].isnull()==False]
		ip_data.sort_index(inplace=True)

		time_index=1
		for _, row in ip_data.iterrows():
		    #logger.debug(str(row))
		    if str(row.anomaly_score) == 'NaT':
			continue
		    anomaly_info={}
		    anomaly_info['A']=round(row.anomaly_score,3)
		    anomaly_info['C']=['Traffic',row.direction]
		    anomaly_info['S']=[ip,row.prot,str(dest_port),list(row.cor_ip_list.split('#')),row.abnormal_event_type,row.gmm_params,row.evt_value]
		    cur_time = row.time
		    end_time = cur_time + TIME_DELTA
		    if row.abnormal_event_type=='ND_score':
			ND_duration = datetime.timedelta(seconds=float(row.raw_values))
			end_time = cur_time + ND_duration
			#end_time = cur_time + TIME_DELTA
		    else:
			end_time = cur_time + TIME_DELTA

		    anomaly_info['T']= [[cur_time.day,cur_time.hour,cur_time.minute,cur_time.second],[end_time.day,end_time.hour,end_time.minute,end_time.second]]
		    anomaly_info['V']=row.raw_values
		    anomaly_info['TimeIndex']=time_index
		    time_index+=1
		    anomaly_info_list.append(anomaly_info)
                bar.next()
        bar.finish()
    logger.info('anomaly info for analysis, list length : '+str(len(anomaly_info_list)))
    return anomaly_info_list

def anomaly_append_id_info(anomaly_list):
    node_index=0
    global node_id_2_index_map
    for anomaly_info in anomaly_list:
        node_id_abbr = 'Net_'+anomaly_info['S'][0]
        if not node_id_2_index_map.has_key(node_id_abbr):
            node_id_2_index_map[node_id_abbr]=node_index
            node_index+=1
        node_id_fullname='Traffic Measurement for Host '+anomaly_info['S'][0] 
        anomaly_info['I']='TD_'+str(node_id_2_index_map[node_id_abbr])
        anomaly_info['ID']=node_id_abbr
        anomaly_info['IF']=node_id_fullname
    return anomaly_list

def load_node_idx(anomaly_event_path):
    event_list = json.load(open(anomaly_event_path))
    for event in event_list:
	abbr_id = event['ID']
	if not node_id_2_index_map.has_key(abbr_id):
	    node_I = event['I']
	    index = int(node_I.split('_')[1])
	    node_id_2_index_map[abbr_id]=index
    return node_id_2_index_map

def filter_vis_events(anomaly_info_list,score_limit):
    filtered_list=[]
    for anomaly_info in anomaly_info_list:
	filtered_event_series = []
	event_field_name = 'timeSeries'
	for event in anomaly_info[event_field_name]:
            if event['port'] in  REMOVE_PROT_PORT_LIST:
		continue
	    if event['weight'] < score_limit:
		continue
	    filtered_event_series.append(event)
        if len(filtered_event_series) == 0:
	    continue
	field_name_list = ['_id','dataType','nodeFullName','nodeName','nodeIndex','categories']
        copy_anomaly_info={}
        for name in field_name_list:
	    copy_anomaly_info[name] = anomaly_info[name]
        copy_anomaly_info[event_field_name] = filtered_event_series
	filtered_list.append(copy_anomaly_info)
    return filtered_list 

def event_to_visual_form(data):
    unique_ip_list = pd.unique(data.ip)
    anomaly_info_list=[]
    bar = Bar('Loading', fill='@',suffix='%(percent)d%% %(avg).3fs', max=len(unique_ip_list))
    for ip in unique_ip_list:
        logger.debug(ip)

        node_id_abbr = 'Net_'+ip
        node_id_fullname='Traffic Measurement for Host '+ ip
        node_index='TD_'+str(node_id_2_index_map[node_id_abbr])
        categories={'category': 'Traffic', 'variableName': 'flow_ANF'}
        time_series=[]

	ip_data = data[(data.ip==ip)]
    	unique_item_list = pd.unique(zip(ip_data.prot,ip_data.dest_port))
	for prot,dest_port in unique_item_list:
	    port_data = ip_data[(ip_data.prot==prot)&(ip_data.dest_port==dest_port)]
	    if port_data.shape[0]==0:
	        logger.error('weird emtpy ip_data')
		raise
	    port_data.groupby(pd.Grouper(freq='1Min',key='time')).apply(agg_multi_func)	
            port_data.sort_values(by=['time'],inplace=True)

            for _, row in port_data.iterrows():
	        if str(row.anomaly_score) == 'NaT':
	            continue
                cur_time = row.time
	        if row.abnormal_event_type=='ND_score':
		    ND_duration = datetime.timedelta(seconds=float(row.raw_values))
	            next_time = cur_time + ND_duration
	            #next_time = cur_time + TIME_DELTA
	        else:
	            next_time = cur_time + TIME_DELTA
                start_time = [cur_time.day,cur_time.hour,cur_time.minute,cur_time.second]
                end_time = [next_time.day,next_time.hour,next_time.minute,next_time.second]
                start_time_str=':'.join([str(e) for e in start_time])
                end_time_str=':'.join([str(e) for e in end_time])

	        node_port = ':'+str(row.dest_port)
	        if row.dest_port == 'None':
		    node_port=''
	        node_port = row.prot+str(node_port)
                time_series.append({
			'weight': round(row.anomaly_score,3),
			'T_start': start_time_str,
			'T_end': end_time_str,
			#'SpaceFloor': space[0],
			#'SpaceZone': space[1],
			#'SpaceRoom': space[2],
			'Variable': row.raw_values,
			'port': node_port,
			'event_type':row.abnormal_event_type,
			'evt_value':row.evt_value,
			'direction':row.direction,
			'gmm_params':row.gmm_params
			})
        anomaly_info = { '_id': node_index,
                   'dataType': DATA_TYPE,
                  'nodeFullName': node_id_fullname,
                  'nodeName': node_id_abbr,
                  'nodeIndex': node_index,
                  'categories': categories,
                  'timeSeries':time_series 
                    }
        anomaly_info_list.append(anomaly_info)
        bar.next()
    bar.finish()
    return anomaly_info_list

def print_anomaly_stat(sub_anomaly_vis_info_list,filter_value):
    print ('filter value '+str(filter_value))
    event_count=0
    for info in sub_anomaly_vis_info_list:
        event_count += len(info['timeSeries'])	
    print ('event count '+str(event_count))

def anomaly_events_to_visual_database(anomaly_event_path):
    print 'converting events data to visual format'
    anomaly_vis_info_path = VIS_OUTPATH
    if not os.path.exists(anomaly_vis_info_path):
	    data = read_anomaly_data(anomaly_event_path)
	    anomaly_vis_info_list = event_to_visual_form(data)
	    json.dump(anomaly_vis_info_list,open(anomaly_vis_info_path,'w'),indent=4,sort_keys=True)
    else:
	    anomaly_vis_info_list = json.load(open(anomaly_vis_info_path))

    drop_database(DB_TABLE_NAME)
    for anomaly_limit_a in np.arange(25,95,5):
        for anomaly_limit_b in np.arange(25,50,5):
            anomaly_limit_a_percent = (anomaly_limit_a+0.0)/100
            sub_anomaly_vis_info_list = filter_vis_events(anomaly_vis_info_list,anomaly_limit_a_percent)
	    print_anomaly_stat(sub_anomaly_vis_info_list,anomaly_limit_a)
            save_to_database(DB_TABLE_NAME,sub_anomaly_vis_info_list,'node',anomaly_limit_a,anomaly_limit_b)
    logger.info('Done in saving anomalies into database')

def anomaly_events_reform_for_analysis(anomaly_event_path):
    global node_id_2_index_map
    anomaly_final_list_path = EVENTS_OUTPATH
    if not os.path.exists(anomaly_final_list_path):
	    anomaly_info_list = traffic_event_reform(anomaly_event_path)
	    anomaly_info_list = anomaly_append_id_info(anomaly_info_list)

	    label = 'traffic'
	    json.dump(anomaly_info_list,open(anomaly_final_list_path,'w'),indent=4,sort_keys=True)
	    logger.info('Done in dumping anomalies to file '+anomaly_final_list_path)
    else:
	    node_id_2_index_map = load_node_idx(anomaly_final_list_path)
	    logger.info('Anomalies json file exists: '+anomaly_final_list_path)

def read_anomaly_data(path):
    data = pd.read_csv(path,parse_dates=['time'],date_parser=lambda epoch: pd.to_datetime(epoch, format='%Y-%m-%d %H:%M:%S.%f'))
    #data = data[data.dest_port.isin([25,6667])]
    logger.info('anomaly data length '+str(data.shape))
    if data.shape[0] == 0:
        raise
    return data

def read_data(path):
    #log_filepath = OUTPUT_PREFIX+'feature_info_dest_1s.csv'
    data = pd.read_csv(path,header=None,names=['time','host_ip','prot','dest_port','NHP','NH','ANF','NF','NP','NB','ND','cor_ip_list'],dtype={'dest_port':object},parse_dates=['time'])
    #data.drop(['NP','NB'],axis=1,inplace=True)
    data.drop(['NP','NHP'],axis=1,inplace=True)
    data = data[~((data.prot=='tcp')&(data.dest_port=='80'))]
    data.sort_values(by='time',inplace=True)
    #data.set_index('time',inplace=True)
    #data = data[data.host_ip.str.startswith('10.')]
    #normal_data = data[(data.index>=datetime.datetime(2013, 4, 2, 9, 0))&(data.index<datetime.datetime(2013, 4, 2, 21, 0))]
    data = data.loc[~data['host_ip'].isin(FILTER_SOURCE_IP_LIST)]
    #data = data.loc[~(data['prot']=='udp')]

    #mask = (data['time'] > NORMAL_START_DATE) & (data['time'] <= NORMAL_END_DATE)
    #normal_data = data.loc[mask]
    normal_data = data
    global attacker_victim_all
    attacker_victim_all += ['147.32.96.69']
    logger.info('attacker ignore list: '+str(attacker_victim_all))
    normal_data = normal_data.loc[~normal_data['host_ip'].isin(attacker_victim_all)]
    return normal_data,data

def traffic_feature_anomaly_detect_by_port(path,direction):
    ANOMALY_SCORE_COL_NAME='anomaly_score'
    ANOMALY_EVENT_TYPE='abnormal_event_type'
    normal_data,data = read_data(path)

    final_data = pd.DataFrame()
    final_data['time']=data.time
    final_data['ip']=data.host_ip
    final_data['dest_port']=data['dest_port']
    final_data['cor_ip_list']=data['cor_ip_list']
    final_data[ANOMALY_SCORE_COL_NAME]=0
    final_data['direction']=direction
    final_data['raw_values']=data.ANF
    final_data[ANOMALY_EVENT_TYPE]=-1

    port_list = list(pd.unique(data.prot,data.dest_port))
    for port in port_list:
        logger.debug('##################################')
        logger.debug('anomaly for '+direction+' data '+str(port))
        select_indices = list(np.where(data.dest_port==port)[0])

	local_normal_data = normal_data.iloc[select_indices]
	local_data = local_normal_data

        index_col,score = feature_anomaly_score_computation(local_normal_data,local_data)
	final_data.iloc[select_indices,final_data.columns.get_loc(ANOMALY_SCORE_COL_NAME)]=score
	final_data.iloc[select_indices,final_data.columns.get_loc(ANOMALY_EVENT_TYPE)]=index_col
    return final_data

def traffic_feature_anomaly_detect_by_prot_port(path,direction):
    ANOMALY_SCORE_COL_NAME='anomaly_score'
    ANOMALY_EVENT_TYPE='abnormal_event_type'
    RAW_VALUE_COL_NAME='raw_values'
    normal_data,data = read_data(path)

    final_data = pd.DataFrame()
    final_data['time']=data.time
    final_data['ip']=data.host_ip
    final_data['prot']=data.prot
    final_data['dest_port']=data['dest_port']
    final_data['cor_ip_list']=data['cor_ip_list']
    final_data[ANOMALY_SCORE_COL_NAME]=0
    final_data['direction']=direction
    final_data[RAW_VALUE_COL_NAME]=0
    final_data[ANOMALY_EVENT_TYPE]=-1

    prot_port_list = list(pd.unique(zip(data.prot,data.dest_port)))
    for prot,port in prot_port_list:
	logger.debug('##################################')
	logger.debug('anomaly for '+direction+' data '+prot+' -> '+str(port))
	select_indices = list(np.where( (data.dest_port==port) & (data.prot==prot))[0])
	select_normal_indices = list(np.where( (normal_data.dest_port==port) & (normal_data.prot==prot))[0])
	local_normal_data = normal_data.iloc[select_normal_indices]
	if local_normal_data.shape[0]==1:
	    local_normal_data = normal_data
	local_data = data.iloc[select_indices]

	index_col,score,value_vector = feature_anomaly_score_computation(local_normal_data,local_data)
	final_data.iloc[select_indices,final_data.columns.get_loc(ANOMALY_SCORE_COL_NAME)]=score
	final_data.iloc[select_indices,final_data.columns.get_loc(ANOMALY_EVENT_TYPE)]=index_col.values
	final_data.iloc[select_indices,final_data.columns.get_loc(RAW_VALUE_COL_NAME)]=value_vector
    return final_data

host2GmmModel={}

GAUSSIAN_MODEL_NAME='gaussian'
GMM_MODEL_NAME ='gmm'

feature2fitmodel = {'NF':GAUSSIAN_MODEL_NAME,'NH':GAUSSIAN_MODEL_NAME,'ANF':GAUSSIAN_MODEL_NAME,'NB':GAUSSIAN_MODEL_NAME,'ND':GMM_MODEL_NAME};

def fit_multiple_gmm_model(data):
    feature2model={}
    for col_name in COL_NAMES:
        X = data[col_name]
	logger.info('fit feature '+col_name)
	logger.info(X)
	fit_model_name = feature2fitmodel[col_name]
	if fit_model_name == GAUSSIAN_MODEL_NAME:
	    best_model = fit_gaussian(np.array(X))
	elif fit_model_name == GMM_MODEL_NAME:
	    best_model = fit_gmm(np.array(X))
        feature2model[col_name]=best_model
    return feature2model

def get_gmm_model_by_key(local_key,local_normal_data):
    global host2GmmModel
    if host2GmmModel.has_key(local_key):
        best_model = host2GmmModel[local_key]
    else:
        best_model = fit_multiple_gmm_model(local_normal_data)
        host2GmmModel[local_key]=best_model
    return best_model

def get_gmm_model_info(model):
    model_params = []
    for i in range(len(model.weights_)):
	mean = model.means_[i][0]
	cov = model.covariances_[i][0]
	weight = model.weights_[i]
	#mean = round(model.means_[i][0],5)
	#cov = round(model.covariances_[i][0],5)
	#weight = round(model.weights_[i],5)
	model_params.append({'mean':mean,'cov':cov,'weight':weight})
    return model_params

def save_gmm_model(output_path):
    global host2GmmModel
    host_gmm_params_data={}
    for key, gmm_model_list in host2GmmModel.items():
        host_params = {}	
	for col_name, model_info in gmm_model_list.items():
	    model_params=[]
	    if model_info['name'] == GMM_MODEL_NAME:
	        model_params = get_gmm_model_info(model_info['model'])
	    elif model_info['name'] == GAUSSIAN_MODEL_NAME:
		mean = model_info['model'][0]
		std_var = model_info['model'][1]
		model_params = [{'mean':mean,'cov':std_var,'weight':1}]
	    else:
		raise
	    host_params[col_name]=model_params
	host_gmm_params_data[key]=host_params
    open(output_path,'w').write(pretty_print(host_gmm_params_data))

def slice_data_by_ip_prot_port(normal_data,data,ip,prot,port):
    # selection of test data
    select_indices = list(np.where((data.host_ip==ip) & (data.dest_port==port) & (data.prot==prot))[0])
    local_data = data.iloc[select_indices]
    # selection of normal data 
    select_normal_indices = list(np.where((normal_data.host_ip==ip) & (normal_data.dest_port==port) & (normal_data.prot==prot))[0])

    local_normal_data = normal_data.iloc[select_normal_indices]
    best_model=''
    if local_normal_data.shape[0]<=10:
	    select_normal_prot_port_indices = list(np.where( (normal_data.dest_port==port) & (normal_data.prot==prot))[0])
	    local_normal_data = normal_data.iloc[select_normal_prot_port_indices]
	    local_key = str(port)+'_'+str(prot)

	    if local_normal_data.shape[0]<=10:
	        local_normal_data = normal_data
		local_key='all'
	    best_model = get_gmm_model_by_key(local_key,local_normal_data)
    else:
	local_key = ip+'_'+str(prot)+'_'+str(port)
        #best_model = fit_multiple_gmm_model(local_data)
	best_model = get_gmm_model_by_key(local_key,local_normal_data)

    local_normal_data = local_normal_data.to_dict(orient='list')
		
    return local_normal_data,best_model,local_data,select_indices

def slice_data_by_ip_prot_port_padding(normal_data,data,ip,prot,port):
    # selection of test data
    select_indices = list(np.where((data.host_ip==ip) & (data.dest_port==port) & (data.prot==prot))[0])
    local_data = data.iloc[select_indices]
    # selection of normal data 
    select_normal_indices = list(np.where((normal_data.host_ip==ip) & (normal_data.dest_port==port) & (normal_data.prot==prot))[0])

    local_normal_data = normal_data.iloc[select_normal_indices]
    local_normal_data = local_normal_data.to_dict(orient='list')
    best_model=''
    PAD_LEN = 60
    if len(local_normal_data)<=60:
	    padded_normal={}
	    for col in local_normal_data.keys():
		a = local_normal_data[col]
	        padded_normal[col]=a + [0] * (PAD_LEN - len(a))
	    local_normal_data = padded_normal

    local_key = ip+'_'+str(prot)+'_'+str(port)
    best_model = get_gmm_model_by_key(local_key,local_normal_data)
		
    return local_normal_data,best_model,local_data,select_indices

def traffic_feature_anomaly_detect_by_host_prot_port(path,direction):
    global host2GmmModel
    host2GmmModel={}
    ANOMALY_SCORE_COL_NAME='anomaly_score'
    ANOMALY_EVENT_TYPE='abnormal_event_type'
    RAW_VALUE_COL_NAME='raw_values'
    GMM_COL_NAME='gmm_params'
    EVT_COL_NAME='evt_value'
    normal_data,data = read_data(path)

    final_data = pd.DataFrame()
    final_data['time']=data.time
    final_data['ip']=data.host_ip
    final_data['prot']=data.prot
    final_data['dest_port']=data['dest_port']
    final_data['cor_ip_list']=data['cor_ip_list']
    final_data[ANOMALY_SCORE_COL_NAME]=0
    final_data['direction']=direction
    final_data[RAW_VALUE_COL_NAME]=0
    final_data[ANOMALY_EVENT_TYPE]=-1
    final_data[GMM_COL_NAME]='None'
    final_data[EVT_COL_NAME]=0

    ip_prot_port_list = list(pd.unique(zip(data.host_ip,data.prot,data.dest_port)))
    bar = Bar('Loading', fill='@',suffix='%(percent)d%% %(avg).3fs', max=len(ip_prot_port_list))
    for ip,prot,port in ip_prot_port_list:
	logger.debug('##################################')
	logger.debug('anomaly for '+direction+' data '+ip+':'+prot+' -> '+str(port))
	#local_normal_data,best_model,local_data,select_indices = slice_data_by_ip_prot_port_padding(normal_data,data,ip,prot,port)
	local_normal_data,best_model,local_data,select_indices = slice_data_by_ip_prot_port(normal_data,data,ip,prot,port)

	#index_col,score,value_vector = feature_anomaly_score_computation_compact(ip,local_normal_data,local_data)
        index_col,score,value_vector,gmm_params,pv_vector = feature_anomaly_score_computation_given_model_save_p_v(ip,prot,port,local_normal_data,best_model,local_data)

	final_data.iloc[select_indices,final_data.columns.get_loc(ANOMALY_SCORE_COL_NAME)]=score
	final_data.iloc[select_indices,final_data.columns.get_loc(ANOMALY_EVENT_TYPE)]=index_col.values
	final_data.iloc[select_indices,final_data.columns.get_loc(RAW_VALUE_COL_NAME)]=value_vector
	final_data.iloc[select_indices,final_data.columns.get_loc(GMM_COL_NAME)]=gmm_params
	final_data.iloc[select_indices,final_data.columns.get_loc(EVT_COL_NAME)]=pv_vector
	bar.next()
    bar.finish()
    return final_data

def traffic_feature_anomaly_detect_overall(path,direction):
    ANOMALY_SCORE_COL_NAME='anomaly_score'
    normal_data,data = read_data(path)

    final_data = pd.DataFrame()
    final_data['time']=data.time
    final_data['ip']=data.host_ip
    final_data['dest_port']=data['dest_port']
    final_data['cor_ip_list']=data['cor_ip_list']
    final_data[ANOMALY_SCORE_COL_NAME]=0
    final_data['direction']=direction
    final_data['raw_values']=data.ANF

    port_list = list(pd.unique(data.dest_port))
    for port in port_list:
        logger.info('##################################')
        logger.info('anomaly for '+direction+' data ')

	local_normal_data = normal_data
	local_data = local_normal_data

        score = feature_anomaly_score_computation(local_normal_data,local_data)
	final_data.iloc[:,final_data.columns.get_loc(ANOMALY_SCORE_COL_NAME)]=score
    return final_data

def traffic_feature_anomaly_detect(src_path,dest_path):
    result_filepath = EVENTS_RAW_OUTPATH
    if not os.path.exists(result_filepath):
	    src_result = traffic_feature_anomaly_detect_by_host_prot_port(src_path,'src')
	    save_gmm_model(SRC_GMM_PATH)
	    dest_result = traffic_feature_anomaly_detect_by_host_prot_port(dest_path,'dest')
	    save_gmm_model(DEST_GMM_PATH)

	    result = pd.concat([src_result,dest_result])
	    result.sort_values(by=['time'])

	    result.to_csv(result_filepath,index=False)
    return result_filepath

def fit_gaussian(normal_X):
    desc = scipy.stats.describe(normal_X)
    mean,var = desc.mean,desc.variance
    std_var = np.sqrt(var)
    logger.info(desc)
    logger.info('mean:'+str(mean)+' std_var:'+str(std_var))
    return {'name':'gaussian','model':[mean,std_var]}

def fit_gmm(normal_X):
    normal_X = normal_X.reshape(len(normal_X),1)
    cf = gmm_fit(normal_X)
    return {'name':'gmm','model':cf}

def gmm_predict(cf,X):
    X = X.values.reshape(len(X),1)
    label_list = cf.predict(X)
    weight = np.array([cf.weights_[e] for e in label_list])
    mean = np.array([cf.means_[e][0] for e in label_list])
    std_var = np.sqrt(np.array([cf.covariances_[e][0] for e in label_list]))
    return label_list,weight,mean,std_var

def feature_anomaly_score_computation_given_model_save_p_v(ip,prot,port,normal_data,best_model,data):
    p_v_matrix = pd.DataFrame()
    gmm_params_dict={}
    colname_list = []
    for col_name in COL_NAMES:
	logger.info('Computing anomaly score for '+ip+':'+prot+':'+str(port)+' -> '+col_name)
        # get mean and var of normal timeseries
        #normal_X = normal_data.loc[:,col_name]
        normal_X = normal_data[col_name]
	logger.info('normal data size '+str(len(normal_X)))

        X = data.loc[:,col_name]
        times = X.index.values

        if not ((prot,col_name) in IGNORED_PROTO_FEATURE_LIST):
		model_info = best_model[col_name];
		if model_info['name'] == GMM_MODEL_NAME:
		    label,weight,mean,std_var = gmm_predict(model_info['model'],X)
		elif model_info['name'] == GAUSSIAN_MODEL_NAME:
		    label=[0]*len(X)
		    weight=[1]*len(X)
		    mean = [model_info['model'][0]]*len(X)
		    std_var = [model_info['model'][1]]*len(X)
		score,p_v = EVT_score_compute_by_vector(len(normal_X),np.array(X),mean,std_var)
	else:
		p_v = [0 for e in X]

        gmm_params = zip(label,weight,mean,std_var)
	gmm_params_str = ['_'.join([str(param) for param in e]) for e in gmm_params]
	gmm_params_dict[col_name] = gmm_params_str

	abnormal_list = [e for e in score if e>0.8]
	if len(abnormal_list)!=0:
	    logger.info('anomaly found');
	    x_score_list = zip(X,score)
	    x_score_list = [ e for e in x_score_list if e[1]>0.8 ]
	    logger.info(x_score_list)
	    normal_X = [round(e,3) for e in normal_X]
	    logger.info(list(normal_X))

        feature_score_col_name = col_name+'_score'
	colname_list.append(feature_score_col_name)
	p_v_matrix[feature_score_col_name]=p_v

    max_p_v = p_v_matrix[colname_list].max(axis=1)
    arg_max_score = p_v_matrix[colname_list].idxmax(axis=1)
    arg_max_score.fillna('None_score',inplace=True)
    logger.info('arg_max_score ')
    logger.info(arg_max_score)

    max_score = [get_EVT_score_from_p(p_v_matrix[arg_max_score.values[e]][e],2) for e in range(len(arg_max_score.values))]
    logger.info('max_score ')
    logger.info(max_score)

    col_name_selection = [e[:-6] for e in arg_max_score.values]
    raw_value_vector = []
    gmm_params_vector = []
    pv_vector = []
    for i in xrange(len(col_name_selection)):
	row = data.iloc[i,:]
	col_name = col_name_selection[i]
	if col_name == 'None':
	   col_val = 'None'
	else:
	   col_val = row[col_name]
        raw_value_vector.append(col_val)
	gmm_params = gmm_params_dict[col_name][i]
	gmm_params_vector.append(gmm_params)
	pv_vector.append(p_v_matrix[col_name+'_score'][i])

    max_score = [round(e,2) for e in max_score]
    return arg_max_score,max_score,raw_value_vector,gmm_params_vector,pv_vector

def feature_anomaly_score_computation_given_model(ip,prot,port,normal_data,best_model,data):
    score_matrix = pd.DataFrame()
    p_v_matrix = pd.DataFrame()
    gmm_params_dict={}
    colname_list = []
    for col_name in COL_NAMES:
	logger.info('Computing anomaly score for '+ip+':'+prot+':'+str(port)+' -> '+col_name)
        # get mean and var of normal timeseries
        #normal_X = normal_data.loc[:,col_name]
        normal_X = normal_data[col_name]
	logger.info('normal data size '+str(len(normal_X)))

        X = data.loc[:,col_name]
        times = X.index.values

        if not ((prot,col_name) in IGNORED_PROTO_FEATURE_LIST):
		model_info = best_model[col_name];
		if model_info['name'] == GMM_MODEL_NAME:
		    label,weight,mean,std_var = gmm_predict(model_info['model'],X)
		elif model_info['name'] == GAUSSIAN_MODEL_NAME:
		    label=[0]*len(X)
		    weight=[1]*len(X)
		    mean = [model_info['model'][0]]*len(X)
		    std_var = [model_info['model'][1]]*len(X)
		score,p_v = EVT_score_compute_by_vector(len(normal_X),np.array(X),mean,std_var)
	else:
		score = [0 for e in X]
		p_v = [0 for e in X]

        gmm_params = zip(label,weight,mean,std_var)
	gmm_params_str = ['_'.join([str(param) for param in e]) for e in gmm_params]
	gmm_params_dict[col_name] = gmm_params_str

	abnormal_list = [e for e in score if e>0.8]
	if len(abnormal_list)!=0:
	    logger.info('anomaly found');
	    x_score_list = zip(X,score)
	    x_score_list = [ e for e in x_score_list if e[1]>0.8 ]
	    logger.info(x_score_list)
	    normal_X = [round(e,3) for e in normal_X]
	    logger.info(list(normal_X))

        feature_score_col_name = col_name+'_score'
	colname_list.append(feature_score_col_name)
        score_matrix[feature_score_col_name]=score
	p_v_matrix[feature_score_col_name]=p_v

    max_score = score_matrix[colname_list].max(axis=1)
    arg_max_score = score_matrix[colname_list].idxmax(axis=1)
    arg_max_score.fillna('None_score',inplace=True)
    logger.info('arg_max_score '+arg_max_score)

    col_name_selection = [e[:-6] for e in arg_max_score.values]
    raw_value_vector = []
    gmm_params_vector = []
    pv_vector = []
    for i in xrange(len(col_name_selection)):
	row = data.iloc[i,:]
	col_name = col_name_selection[i]
	if col_name == 'None':
	   col_val = 'None'
	else:
	   col_val = row[col_name]
        raw_value_vector.append(col_val)
	gmm_params = gmm_params_dict[col_name][i]
	gmm_params_vector.append(gmm_params)

    max_score = [round(e,2) for e in max_score]
    return arg_max_score,max_score,raw_value_vector,gmm_params_vector

def main():
    anomaly_event_path = traffic_feature_anomaly_detect(SRC_PATH,DEST_PATH)

    anomaly_events_reform_for_analysis(anomaly_event_path)

    anomaly_events_to_visual_database(anomaly_event_path)

if __name__ == '__main__':
    start_time = time.time()
    config_logger()
    main()
    end_time = time.time()
    print('task done in '+str(round(end_time-start_time,2))+'s')
