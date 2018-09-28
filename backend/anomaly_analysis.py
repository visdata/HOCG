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
import itertools

import scipy.stats
import json

from Util import time_string_remove_day,save_to_database,drop_database,ip_is_whitelist,append_list_to_csv,logger,config_logger,pretty_print,EVT_score_compute_by_vector,gmm_fit,query_db

DATA_PREFIX='data/'
OUTPUT_PREFIX='output/'
DB_TABLE_NAME='vast16_anomaly_graph'

DATA_PATH = DATA_PREFIX+'bldg-MC2.csv'
GMM_PATH = OUTPUT_PREFIX+'gmm.json'

TIME_FEATURE_NAME='Date/Time'

EVENTS_RAW_OUTPATH = OUTPUT_PREFIX+'anomaly_raw.txt'
VIS_OUTPATH = OUTPUT_PREFIX+'vis_anomaly_traffic.json'

NORMAL_START_DATE = datetime.datetime(2016,5,31,0,0,0)
NORMAL_END_DATE = datetime.datetime(2016,5,31,23,59,59)
#normal_time_range=[([2016,5,31,0,0,0],[2016,6,1,23,59,59]),
#        ([2016,6,4,0,0,0],[2016,6,5,23,59,59])
#        ]
normal_time_range=[([2016,5,31,0,0,0],[2016,6,3,17,59,59])
        ]

NORMAL_SAMPLE_SIZE = (NORMAL_END_DATE - NORMAL_START_DATE).seconds
print ('Normal period last for '+str(NORMAL_SAMPLE_SIZE)+' seconds')

ZONE_MAP={'1':['1','2','3','4','5','6','7','8A','8B'],
          '2':['1','2','3','4','5','6','7','8','9','10','11','12A','12B','12C','13','14','15','16'],
          '3':['1','2','3','4','5','6','7','8','9','10','11A','11B','11C','12']
        }
COL_NAMES=['value']

ZONE_LIST=[]
for floor,zones in ZONE_MAP.items():
    for zone in zones:
        ZONE_LIST.append('F_'+floor+'_Z_'+zone)

C_ZONE_LIST=[]
for floor,zones in ZONE_MAP.items():
    for zone in zones:
        C_ZONE_LIST.append('F'+floor+'-Z'+zone)

FEATURE_SELECTED=['Thermostat Cooling Setpoint','Thermostat Heating Setpoint','Thermostat Temp','REHEAT COIL Power','VAV REHEAT Damper Position']

FEATURES_ABBR_MAP={'Lights Power':'LightPow',\
                   'Equipment Power':'EquiPow',\
                   'Thermostat Temp':'ThermosTemp',
                   'Thermostat Heating Setpoint':'THermosHeat',
                   'Thermostat Cooling Setpoint':'ThermosCool',
                   'VAV Availability Manager Night Cycle Control Status':'VAVStatus',
                   'SUPPLY FAN:Fan Power':'FanPow',
                   'Power':'Pow',
                   'VAV REHEAT Damper Position':'ReheatDamperPos',
                   'REHEAT COIL Power':'ReheatCoilPow',
                   'HEATING COIL Power':'HeatCoilPow',
                   'Outdoor Air Flow Fraction':'OutAirFrac',
                   'Outdoor Air Mass Flow Rate':'OutAirRate',
                   'COOLING COIL Power':'CoolCoilPow',
                   'AIR LOOP INLET Temperature':'AirTemp',
                   'AIR LOOP INLET Mass Flow Rate':'AirFlowRate',
                   'SUPPLY FAN OUTLET Temperature':'FanTemp',
                   'SUPPLY FAN OUTLET Mass Flow Rate':'FanRate',
                   'RETURN OUTLET CO2 Concentration':'OutCO2',
                   'SUPPLY INLET Temperature':'InTemp',
                   'SUPPLY INLET Mass Flow Rate':'InFlowRate',
                   'Mechanical Ventilation Mass Flow Rate':'VentiRate',
                   'VAV Damper Position':'DamperPos'}

DATA_TYPE ='measurement'

M_FILTER=25

node_id_2_index_map={}

TIME_DELTA=datetime.timedelta(minutes=5)

class space_corr_params():
    def __init__(self, floor, zone, room):
        self.floor = floor
        self.zone = zone
        self.room = room

class HVAC_VAR():
    def __init__(self, tmin, tmax, a_t, cat_beita):
        self.tmin = tmin
        self.tmax = tmax
        self.a_t = a_t
        self.cat_beita = cat_beita

def is_close_record(stamp1, stamp2, delta_min):
    d1 = datetime.datetime(stamp1[0],stamp1[1],stamp1[2],stamp1[3],stamp1[4],stamp1[5])
    d2 = datetime.datetime(stamp2[0],stamp2[1],stamp2[2],stamp2[3],stamp2[4],stamp2[5])
    if abs(d1-d2).total_seconds() <= delta_min * 60:return 1
    else:return 0

def T_to_datetime(stamp):
    #return datetime.datetime(2016,1,stamp[0],stamp[1],stamp[2],stamp[3])
    return datetime.datetime(stamp[0],stamp[1],stamp[2],stamp[3],stamp[4],stamp[5])

def datetime_to_T(stamp):
    #return [stamp.day, stamp.hour, stamp.minute, stamp.second]
    return [stamp.year, stamp.month, stamp.day, stamp.hour, stamp.minute, stamp.second]

def translate_datetime_string_to_visual_time_format(timestamp):
    part1,part2 = timestamp.split()
    date = int(part1.split('-')[2])
    if date==31:
        date=1
    else:
        date+=1
    hour,minu,sec = part2.split(':')
    selected = [str(date),hour,minu,sec]
    return ':'.join(selected)

def combining_neighbouring_vis_records(data,significant_diff,key):
    result = []
    i = 0
    if len(data)==0:
        return result
    #if data[0]['ID'] == 'F3-Z1':
    #    print ('significant_diff value for '+key+' -> '+str(significant_diff))
    while i < len(data):
        lastT = data[i]['T'][1][:]
        lastV = data[i]['V']
        period_s = T_to_datetime(lastT)
        period_e = period_s + datetime.timedelta(0,300)
        A = [float(data[i]['A'])]
        for j in range(i + 1, len(data)):
            currentT = data[j]['T'][1][:]
            currentV = data[j]['V']
            if (is_close_record(currentT,lastT,5) or ((period_e - period_s).total_seconds() >= 3600 and is_close_record(currentT,lastT,10))) and ((abs(currentV-lastV))<significant_diff):
                #print('combining neighbouring items')
                period_e += datetime.timedelta(0,300)
                A.append(float(data[j]['A']))
                lastT = currentT
                lastV = currentV
                if j == len(data)-1:
                    i = j
                    break
            else:
                i = j
                break
        new_A_value = max(A)
        new_record = data[i].copy()
        new_record['A'] = new_A_value
        new_record['T'] = [datetime_to_T(period_s), datetime_to_T(period_e)]
        result.append(new_record)
        if i== len(data)-1:break
    return result

def sensor_event_reform(path):
    data = read_anomaly_data(path)
    result_anomaly_info={}

    print ('reforming ')
    unique_sensor = list(set(zip(data.zone,data.feature)))
    bar = Bar('Loading', fill='@',suffix='%(percent)d%% %(avg).3fs', max=len(unique_sensor))
    print ('number of unique sensor '+str(len(unique_sensor)))
    for zone,feature in unique_sensor:
            logger.debug(zone + ' : '+feature)
            if zone not in ZONE_LIST:
                bar.next()
                continue
            sensor_data = data[(data.zone==zone)&(data.feature==feature)]
            if sensor_data.shape[0]==0:
                    logger.error('weird emtpy sensor_data')
                    raise
            sensor_data.sort_values(by=['time'],inplace=True)
            time_index=1
            local_anomaly_info_list=[]
            for _, row in sensor_data.iterrows():
                #logger.debug(str(row))
                if str(row.anomaly_score) == 'NaT':
                    bar.next()
                    continue
                anomaly_info={}
                anomaly_info['A']=round(row.anomaly_score,3)
                anomaly_info['C']=['Measurements',feature]
                loc_array = zone.split('_')
                if(len(loc_array))!=4:
                    print('error in parsing zone string : '+zone)
                floor = loc_array[0]+loc_array[1]
                room = loc_array[2]+loc_array[3]
                anomaly_info['S']=[floor,room]
                cur_time = row.time
                end_time = cur_time + TIME_DELTA
                anomaly_info['T']= [[cur_time.year,cur_time.month,cur_time.day,cur_time.hour,cur_time.minute,cur_time.second],[end_time.year,end_time.month,end_time.day,end_time.hour,end_time.minute,end_time.second]]
                anomaly_info['V']=row.raw_values
                anomaly_info['G']=row.gmm_params
                anomaly_info['TimeIndex']=time_index
                time_index+=1
                local_anomaly_info_list.append(anomaly_info)
            key=zone+':'+feature
            result_anomaly_info[key]=local_anomaly_info_list
            bar.next()
    bar.finish()
    logger.info('anomaly info for analysis, list length : '+str(len(result_anomaly_info)))
    return result_anomaly_info

def gen_id_info():
    node_index=0
    global node_id_2_index_map
    for zone in ZONE_LIST:
        zone_array = zone.split('_')
        zone_name = zone_array[0]+zone_array[1]+'-'+zone_array[2]+zone_array[3]
        node_id_abbr = zone_name
        if not node_id_abbr in node_id_2_index_map:
            node_id_2_index_map[node_id_abbr]=node_index
            node_index+=1

def anomaly_append_id_info(anomaly_info_all):
    node_index=0
    global node_id_2_index_map
    for key,anomaly_list in anomaly_info_all.items():
        for anomaly_info in anomaly_list:
            zone_name = '-'.join(anomaly_info['S'])
            #node_id_abbr = 'Zone_'+zone_name
            node_id_abbr = zone_name
            node_id_fullname='Sensor Measurement for Zone '+zone_name
            anomaly_info['I']='Z_'+str(node_id_2_index_map[node_id_abbr])
            anomaly_info['ID']=node_id_abbr
            anomaly_info['IF']=node_id_fullname
    return anomaly_info_all

def load_node_idx(anomaly_event_path):
    event_list = json.load(open(anomaly_event_path))
    for event in event_list:
        abbr_id = event['ID']
        if not abbr_id in node_id_2_index_map:
            node_I = event['I']
            index = int(node_I.split('_')[1])
            node_id_2_index_map[abbr_id]=index
    return node_id_2_index_map

def filter_events(anomaly_info,score_limit):
    anomaly_list=[]
    filter_value_below_1 = ((score_limit+0.0)/100.0)
    print('filtering events with score limit '+str(filter_value_below_1))
    bar = Bar('Loading', fill='@',suffix='%(percent)d%% %(avg).3fs', max=len(anomaly_info))
    for key,event_list in anomaly_info.items():
        local_anomaly_list=[]
        value_list = [e['V'] for e in event_list]
        max_v = max(value_list)
        min_v = min(value_list)
        significant_diff = (max_v-min_v)*0.3
        for event in event_list:
            if event['A'] < filter_value_below_1:
                continue
            local_anomaly_list.append(event)
        local_anomaly_list = combining_neighbouring_vis_records(local_anomaly_list,significant_diff,key)
        anomaly_list+=local_anomaly_list
        bar.next()
    bar.finish()
    return anomaly_list

def filter_vis_events(anomaly_info_list,score_limit):
    filtered_list=[]
    for anomaly_info in anomaly_info_list:
        filtered_event_series = []
        event_field_name = 'timeSeries'
        for event in anomaly_info[event_field_name]:
            if event['weight'] < score_limit:
                continue
            #print (str(event['weight'])+' <-> '+ str(score_limit))
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

def analytical_event_to_visual_form(sensor_data):
    unique_zone_list = pd.unique([e['ID'] for e in sensor_data])
    anomaly_info_list=[]
    bar = Bar('Loading', fill='@',suffix='%(percent)d%% %(avg).3fs', max=len(unique_zone_list))
    for zone in unique_zone_list:
        if not zone in C_ZONE_LIST:
            continue
        logger.debug('visual_forming '+zone)
        zone_data = [e for e in sensor_data if e['ID']==zone]
        if len(zone_data)==0:
            print ('weird emtpy ip_data')
            raise
        zone_name = zone
        node_id_abbr = zone_name
        node_id_fullname=zone_name
        node_index='Z_'+str(node_id_2_index_map[node_id_abbr])

        categories={'category': 'sensor', 'variableName': 'NoneValue'}

        time_series=[]
        for event in zone_data:
            cur_time = T_to_datetime(event['T'][0])
            next_time = T_to_datetime(event['T'][1])
            start_time = [1 if cur_time.day==31 else cur_time.day+1,cur_time.hour,cur_time.minute,cur_time.second]
            end_time = [1 if next_time.day==31 else next_time.day+1,next_time.hour,next_time.minute,next_time.second]
            start_time_str=':'.join([str(e) for e in start_time])
            end_time_str=':'.join([str(e) for e in end_time])

            node_port = event['C'][1]
            time_series.append({
                'weight': round(event['A'],3),
                'T_start': start_time_str,
                'T_end': end_time_str,
                #'SpaceFloor': space[0],
                #'SpaceZone': space[1],
                #'SpaceRoom': space[2],
                'Variable': event['V'],
		'port': node_port,
		'gmm_params':event['G']
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

def event_to_visual_form(data):
    unique_zone_list = pd.unique(data.zone)
    anomaly_info_list=[]
    bar = Bar('Loading', fill='@',suffix='%(percent)d%% %(avg).3fs', max=len(unique_zone_list))
    for zone in unique_zone_list:
        if not zone in ZONE_LIST:
            continue
        logger.debug(zone)
        zone_data = data[data.zone==zone]
        if zone_data.shape[0]==0:
            print ('weird emtpy ip_data')
            raise
        zone_data.sort_values(by='time',inplace=True)

        zone_name_array = zone.split('_')
        zone_name = zone_name_array[0]+zone_name_array[1]+'-'+zone_name_array[2]+zone_name_array[3]
        node_id_abbr = zone_name
        node_id_fullname='Sensor Measurement for Zone '+zone_name
        node_index='Z_'+str(node_id_2_index_map[node_id_abbr])

        categories={'category': 'sensor', 'variableName': 'NoneValue'}

        time_series=[]
        for _, row in zone_data.iterrows():
            if str(row.anomaly_score) == 'NaT':
                continue
            cur_time = row.time
            next_time = cur_time + TIME_DELTA
            start_time = [1 if cur_time.day==31 else cur_time.day+1,cur_time.hour,cur_time.minute,cur_time.second]
            end_time = [1 if next_time.day==31 else next_time.day+1,next_time.hour,next_time.minute,next_time.second]
            start_time_str=':'.join([str(e) for e in start_time])
            end_time_str=':'.join([str(e) for e in end_time])

            node_port = row.feature
            time_series.append({
                'weight': round(row.anomaly_score,3),
                'T_start': start_time_str,
                'T_end': end_time_str,
                #'SpaceFloor': space[0],
                #'SpaceZone': space[1],
                #'SpaceRoom': space[2],
                'Variable': row.raw_values,
		'port': node_port,
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

def analytical_events_to_visual_database(sensor_data,filter_value,filter_value_movement,movement_data):
    print ('converting events data to visual format')
    VIS_OUTPATH = OUTPUT_PREFIX+'vis_anomaly_traffic_h'+str(filter_value)+'_m'+str(filter_value_movement)+'.json'
    anomaly_vis_info_path = VIS_OUTPATH
    filter_value_below_1 = ((filter_value+0.0)/100.0)
    if not os.path.exists(anomaly_vis_info_path):
            anomaly_vis_info_list = analytical_event_to_visual_form(sensor_data)
            json.dump(anomaly_vis_info_list,open(anomaly_vis_info_path,'w'),indent=4,sort_keys=True)
    else:
	    anomaly_vis_info_list = json.load(open(anomaly_vis_info_path))

    sub_anomaly_vis_info_list = anomaly_vis_info_list
    sub_anomaly_vis_info_list += movement_data.values()
    #print (sub_anomaly_vis_info_list)
    nodes_collection_name='node_filtered_h'+str(filter_value)+'_m'+str(filter_value_movement)
    save_to_database(DB_TABLE_NAME,sub_anomaly_vis_info_list,nodes_collection_name)
    logger.info('Done in saving anomalies into database')

def anomaly_events_to_visual_database(anomaly_event_path,filter_value,filter_value_movement,movement_data):
    print ('converting events data to visual format')
    VIS_OUTPATH = OUTPUT_PREFIX+'vis_anomaly_traffic_h'+str(filter_value)+'_m'+str(filter_value_movement)+'.json'
    anomaly_vis_info_path = VIS_OUTPATH
    filter_value_below_1 = ((filter_value+0.0)/100.0)
    if not os.path.exists(anomaly_vis_info_path):
            data = read_anomaly_data(anomaly_event_path)
            data = data[data.anomaly_score>filter_value_below_1]
            anomaly_vis_info_list = event_to_visual_form(data)
            json.dump(anomaly_vis_info_list,open(anomaly_vis_info_path,'w'),indent=4,sort_keys=True)
    else:
	    anomaly_vis_info_list = json.load(open(anomaly_vis_info_path))

    sub_anomaly_vis_info_list = anomaly_vis_info_list
    sub_anomaly_vis_info_list += movement_data.values()
    #print (sub_anomaly_vis_info_list)
    nodes_collection_name='node_filtered_h'+str(filter_value)+'_m'+str(filter_value_movement)
    save_to_database(DB_TABLE_NAME,sub_anomaly_vis_info_list,nodes_collection_name)
    logger.info('Done in saving anomalies into database')

def anomaly_events_reform_for_analysis(anomaly_event_path):
    global node_id_2_index_map

    EVENTS_OUTPATH = OUTPUT_PREFIX+'anomaly_sensor.json'
    anomaly_final_list_path = EVENTS_OUTPATH

    if not os.path.exists(anomaly_final_list_path):
	    anomaly_info = sensor_event_reform(anomaly_event_path)
	    anomaly_info = anomaly_append_id_info(anomaly_info)

	    label = 'sensor measurement'
	    json.dump(anomaly_info,open(anomaly_final_list_path,'w'),indent=4,sort_keys=True)
	    logger.info('Done in dumping anomalies to file '+anomaly_final_list_path)
    else:
	    logger.info('Anomalies json file exists: '+anomaly_final_list_path)
	    anomaly_info = json.load(open(anomaly_final_list_path))
    return anomaly_info

def read_anomaly_data(path):
    data = pd.read_csv(path,parse_dates=['time'],date_parser=lambda epoch: pd.to_datetime(epoch, format='%Y-%m-%d %H:%M:%S.%f'))
    #data = data[data.dest_port.isin([25,6667])]
    logger.info('anomaly data length '+str(data.shape))
    if data.shape[0] == 0:
        raise
    return data

def get_normal_data(data):
    time_attribute = TIME_FEATURE_NAME
    mask_array=[]
    for time_begin,time_end in normal_time_range:
        begin = datetime.datetime(time_begin[0],time_begin[1],time_begin[2],time_begin[3],time_begin[4],time_begin[5])
        end = datetime.datetime(time_end[0],time_end[1],time_end[2],time_end[3],time_end[4],time_end[5])
        mask = (data[time_attribute] > begin) & (data[time_attribute] <= end)
        mask_array.append(mask)
    result = np.array([False]*len(mask_array[0]))
    for mask in mask_array:
        result = result | np.array(mask)

    normal_data = data.loc[result]
    return normal_data

removed_zone_list=['F_3_Z_1','F_2_Z_16','F_1_Z_2','F_2_Z_14','F_2_Z_6','F_2_Z_14','F_3_Z_5','F_3_Z_6','F_2_Z_8','F_3_Z_9']

def read_data(path):
    time_attribute = TIME_FEATURE_NAME
    data = pd.read_csv(path,parse_dates=[time_attribute])
    data.sort_values(by=time_attribute,inplace=True)
    col_names = data.columns.values
    data.set_index(time_attribute,inplace=True)
    data = data.stack()
    data = data.reset_index()
    data.columns = [time_attribute,'Feature','value']
    data.set_index(time_attribute,inplace=True)

    global_status_data = data[~data.Feature.str.contains('F_')]
    zones_status_data = data[data.Feature.str.contains('F_')]

    new_zones_status_data = pd.DataFrame()
    new_zones_status_data['zone'] = zones_status_data['Feature'].apply(lambda x: x.split(' ')[1][:-1] if x.find(':')!=-1 else x.split(' ')[1])
    new_zones_status_data['feature'] = zones_status_data.Feature.str.split(' ',n=2).str.get(2)
    new_zones_status_data['value']=zones_status_data.value
    new_zones_status_data.reset_index(inplace=True)
    print (new_zones_status_data.head(2))
    print (new_zones_status_data.columns.values)

    zone_list = (pd.unique(new_zones_status_data.zone))
    for zone in ZONE_LIST:
        if not zone in zone_list:
            print ('not found '+zone)

    feature_list = (pd.unique(new_zones_status_data.feature))
    print(feature_list)

    data = new_zones_status_data
    data = data.loc[data['feature'].isin(FEATURE_SELECTED)]

    normal_data = get_normal_data(data)
    #normal_data = data
    #normal_data = normal_data[~(normal_data.zone=='F_3_Z_1')]
    normal_data = normal_data.loc[~(normal_data['zone'].isin(removed_zone_list))]
    print ('normal data')
    print (normal_data.tail(2))
    #print (data.tail(2))
    return normal_data,data

host2GmmModel={}

def fit_multiple_gmm_model(data):
    feature2model={}
    for col_name in COL_NAMES:
        X = data[col_name]
        logger.info('fit feature '+col_name)
        logger.info(X.tolist())
        best_model = fit_gmm(np.array(X))
        feature2model[col_name]=best_model
    return feature2model

def get_gmm_model_by_key(local_key,local_normal_data):
    global host2GmmModel
    if local_key in host2GmmModel:
        best_model = host2GmmModel[local_key]
    else:
        best_model = fit_multiple_gmm_model(local_normal_data)
        host2GmmModel[local_key]=best_model
    return best_model

def save_gmm_model(output_path):
    global host2GmmModel
    host_gmm_params_data={}
    for key, gmm_model_list in host2GmmModel.items():
        host_params = {}	
        for col_name, model in gmm_model_list.items():
            model_params = []
            for i in range(len(model.weights_)):
                mean = round(model.means_[i][0],5)
                cov = round(model.covariances_[i][0],5)
                weight = round(model.weights_[i],5)
                model_params.append({'mean':mean,'cov':cov,'weight':weight})
            host_params[col_name]=model_params
        host_gmm_params_data[key]=host_params
    open(output_path,'w').write(pretty_print(host_gmm_params_data))

def server_room_data(normal_data,data,zone,feature,time_range):
    select_indices = list(np.where((data.zone==zone) & (data.feature==feature) & (data[TIME_FEATURE_NAME].dt.hour==time_range))[0])
    local_data = data.iloc[select_indices]

    normal_time_begin = datetime.datetime(2016,5,31,0,0,0)
    normal_time_end= datetime.datetime(2016,6,2,12,00,00)
    
    select_normal_indices = list(np.where((normal_data.feature==feature))[0])
    local_normal_data = normal_data.iloc[select_normal_indices]
    local_normal_data = local_normal_data.loc[str(normal_time_begin):str(normal_time_end)]

    best_model=''
    local_key = zone+'_'+feature
    best_model = get_gmm_model_by_key(local_key,local_normal_data)
    local_normal_data = local_normal_data.to_dict(orient='list')
    return local_normal_data,best_model,local_data,select_indices

def slice_data(normal_data,data,zone,feature,time_range):
    begin_time = str(time_range)+':00'
    if time_range<23:
        end_time = str(time_range+1)+':00'
    else:
        end_time = '00:00'

    if zone == 'F_3_Z_9':
        return server_room_data(normal_data,data,zone,feature,time_range)

    # selection of test data
    select_indices = list(np.where((data.zone==zone) & (data.feature==feature) & (data[TIME_FEATURE_NAME].dt.hour==time_range))[0])
    local_data = data.iloc[select_indices]

    # selection of normal data 
    #normal_data.set_index('time',inplace=True)
    select_normal_indices = list(np.where((normal_data.feature==feature))[0])
    local_normal_data = normal_data.iloc[select_normal_indices]
    local_normal_data = local_normal_data.between_time(begin_time,end_time,include_start=True,include_end=False)
    #print ('slice data normal data shape '+str(local_normal_data.shape))
    #normal_data.reset_index(inplace=True)

    best_model=''
    local_key = feature+'_'+str(time_range)
    best_model = get_gmm_model_by_key(local_key,local_normal_data)
    local_normal_data = local_normal_data.to_dict(orient='list')
    return local_normal_data,best_model,local_data,select_indices

def traffic_feature_anomaly_detect(path):
    global host2GmmModel
    host2GmmModel={}
    ANOMALY_SCORE_COL_NAME='anomaly_score'
    ANOMALY_EVENT_TYPE='abnormal_event_type'
    RAW_VALUE_COL_NAME='raw_values'
    GMM_COL_NAME='gmm_params'
    normal_data,data = read_data(path)

    final_data = pd.DataFrame()
    final_data['time']=data[TIME_FEATURE_NAME]
    #final_data['time']=data.index.values
    final_data['zone']=data.zone
    final_data['feature']=data.feature
    final_data[ANOMALY_SCORE_COL_NAME]=0
    final_data[RAW_VALUE_COL_NAME]=0
    final_data[GMM_COL_NAME]='None'

    normal_data.set_index(TIME_FEATURE_NAME,inplace=True)
    #data.set_index(TIME_FEATURE_NAME,inplace=True)

    zone_feature_list = list(set(zip(data.zone,data.feature)))
    bar = Bar('Loading', fill='@',suffix='%(percent)d%% %(avg).3fs', max=len(zone_feature_list))
    for zone,feature in zone_feature_list:
        if not zone in ZONE_LIST:
            bar.next()
            continue
        for time_range in range(24):
            logger.debug('##################################')
            logger.debug('anomaly for zone '+zone+' : '+feature+' time range '+str(time_range))
            local_normal_data,best_model,local_data,select_indices = slice_data(normal_data,data,zone,feature,time_range)
            score,value_vector,gmm_params = feature_anomaly_score_computation_given_model(zone,feature,local_normal_data,best_model,local_data)

            #print ('select_indices shape '+str(len(select_indices)))
            #print ('score shape '+str(score.shape))
            final_data.iloc[select_indices,final_data.columns.get_loc(ANOMALY_SCORE_COL_NAME)]=score
            final_data.iloc[select_indices,final_data.columns.get_loc(RAW_VALUE_COL_NAME)]=value_vector
            final_data.iloc[select_indices,final_data.columns.get_loc(GMM_COL_NAME)]=gmm_params
        bar.next()
    bar.finish()
    data.reset_index()
    return final_data

def traffic_feature_anomaly_detect_by_zone(path):
    result_filepath = EVENTS_RAW_OUTPATH
    if not os.path.exists(result_filepath):
            result = traffic_feature_anomaly_detect(path)
            save_gmm_model(GMM_PATH)
            result.sort_values(by=['time'])
            result.to_csv(result_filepath,index=False)
    else:
            result = pd.read_csv(result_filepath)

    for filter_value in [0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9]:
        result_notable = result[result.anomaly_score>=filter_value]
        result_notable.to_csv(result_filepath+'_'+str(int(filter_value*100))+'.notable',index=False)
    return result_filepath
  
def fit_gaussian(normal_X):
    desc = scipy.stats.describe(normal_X)
    mean,var = desc.mean,desc.variance
    std_var = np.sqrt(var)
    logger.info(desc)
    logger.info('mean:'+str(mean)+' std_var:'+str(std_var))
    return mean,var

def fit_gmm(normal_X):
    normal_X = normal_X.reshape(len(normal_X),1)
    cf = gmm_fit(normal_X)
    return cf

def gmm_predict(cf,X,normal_len):
    X = np.array(X)
    X = X.reshape(len(X),1)
    label_list = cf.predict(X)
    weight = np.array([cf.weights_[e] for e in label_list])
    mean = np.array([cf.means_[e][0] for e in label_list])
    std_var = np.sqrt(np.array([cf.covariances_[e][0] for e in label_list]))
    m_star = np.array([max(1,int(cf.weights_[e]*normal_len)) for e in label_list])
    #print ('normal len in gmm_predict '+str(normal_len))
    return label_list,weight,mean,std_var,m_star

def feature_anomaly_score_computation_given_model(zone,feature,normal_data,best_model,data):
    score_matrix = pd.DataFrame()
    gmm_params_dict={}
    colname_list = []
    col_name = 'value'
    normal_X = normal_data[col_name]
    logger.info('normal data size '+str(len(normal_X)))

    X = data.loc[:,col_name]
    times = X.index.values

    label,weight,mean,std_var,m_star = gmm_predict(best_model[col_name],X,len(normal_X))
    score = EVT_score_compute_by_vector(m_star,np.array(X),mean,std_var)

    gmm_params = zip(label,weight,mean,std_var)
    gmm_params_str = ['_'.join([str(param) for param in e]) for e in gmm_params]

    abnormal_list = [e for e in score if e>0.8]
    if len(abnormal_list)!=0:
        logger.info('anomaly found '+zone+' -> '+feature);
        x_score_list = zip(X,score)
        x_score_list = [ e for e in x_score_list if e[1]>0.8 ]
        logger.info(x_score_list)
        normal_X = [round(e,3) for e in normal_X]
        logger.info(list(normal_X))

    feature_score_col_name = col_name+'_score'
    colname_list.append(feature_score_col_name)
    score_matrix[feature_score_col_name]=score

    gmm_params_vector = []
    return score,X,gmm_params_str

SOURCE_DATABASE='anomaly_graph4'

def get_movement_edge_data(filter_value,mov_filter):
    database_name=SOURCE_DATABASE
    collection_name='edge_filtered_h'+str(filter_value)+'_m'+str(mov_filter)
    data = query_db(database_name,collection_name)
    movement_edge_info_list=[]
    for row in data:
        row.pop('_id',None)
        if row['EdgeType'] == 'movement':
            movement_edge_info_list.append(row)
    return movement_edge_info_list

def get_movement_data(filter_value,mov_filter):
    database_name=SOURCE_DATABASE
    nodes_collection_name='node_filtered_h'+str(filter_value)+'_m'+str(mov_filter)
    sensor_data = query_db(database_name,nodes_collection_name)
    movement_node_info_list={}
    for row in sensor_data:
        row.pop('_id',None)
        nodename = row['nodeName']
        if row['dataType'] == 'movement':
            for event in row['timeSeries']:
                event['port']='Human'
            movement_node_info_list[nodename]=row
    return movement_node_info_list

def load_mov2mov_data():
    MOVE_DATA_PATH=OUTPUT_PREFIX+'mov2mov.json'
    mov_data_dict={}
    if not os.path.exists(MOVE_DATA_PATH):
        for mov_filter in range(25,50,5):
            mov_data = get_movement_edge_data(25,mov_filter)
            mov_data_dict[str(mov_filter)]=mov_data

        open(MOVE_DATA_PATH,'w').write(pretty_print(mov_data_dict))
    else:
        mov_data_dict = json.load(open(MOVE_DATA_PATH,'rb'))
    return mov_data_dict

def load_mov_data():
    MOVE_DATA_PATH=OUTPUT_PREFIX+'movement.json'
    mov_data_dict={}
    if not os.path.exists(MOVE_DATA_PATH):
        for mov_filter in range(25,50,5):
            mov_data = get_movement_data(25,mov_filter)
            mov_data_dict[str(mov_filter)]=mov_data

        mov_data = get_movement_data(100,0)
        mov_data_dict['0']=mov_data

        open(MOVE_DATA_PATH,'w').write(pretty_print(mov_data_dict))
    else:
        mov_data_dict = json.load(open(MOVE_DATA_PATH,'rb'))
    return mov_data_dict

def calc_space_corr_HVAC(stamp1,stamp2): # stamp = [floor, zone, room]
    flags = [0,0]
    if stamp1[0] == stamp2[0] and stamp1[0] != 'Null' and stamp2[0] != 'Null':flags[0]=1
    if stamp1[1] == stamp2[1] and stamp1[1] != 'Null' and stamp2[1] != 'Null':flags[1]=1
    if flags[0]==1 and flags[1]==1:return space_corr.zone
    elif flags[0]==1:return space_corr.floor
    else:return 0

def calc_tempora_corr(event_a,event_b):
    time_a = event_a['T']
    time_b = event_b['T']
    #print ('time_a '+str(time_a))
    #print ('time_b '+str(time_b))
    time_index_a = event_a['TimeIndex']
    time_index_b = event_b['TimeIndex']
    time_a_s = datetime.datetime(time_a[0][0],time_a[0][1],time_a[0][2],time_a[0][3],time_a[0][4],time_a[0][5])
    time_a_e = datetime.datetime(time_a[1][0],time_a[1][1],time_a[1][2],time_a[1][3],time_a[1][4],time_a[1][5])
    time_b_s = datetime.datetime(time_b[0][0],time_b[0][1],time_b[0][2],time_b[0][3],time_b[0][4],time_b[0][5])
    time_b_e = datetime.datetime(time_b[1][0],time_b[1][1],time_b[1][2],time_b[1][3],time_b[1][4],time_b[1][5])
    if time_a_s < time_b_s:
        source_time = {'start':str(time_a_s),'end':str(time_a_e)}
        source_index=event_a['I']
        dest_time = {'start':str(time_b_s),'end':str(time_b_e)}
        dest_index=event_b['I']
        source_TI=time_index_a
        dest_TI=time_index_b
        os = time_b_s
        oe = time_b_e
        time_interval=(time_b_s-time_a_s).total_seconds()
        #logger.debug('time delta '+str(time_b_s-time_a_s))
    else:
        source_time = {'start':str(time_b_s),'end':str(time_b_e)}
        source_index=event_b['I']
        dest_time = {'start':str(time_a_s),'end':str(time_a_e)}
        dest_index=event_a['I']
        source_TI=time_index_b
        dest_TI=time_index_a
        os = time_a_s
        oe = time_a_e
        time_interval=(time_a_s-time_b_s).total_seconds()
        #logger.debug('time delta '+str(time_a_s-time_b_s))
    #print ('time interval '+str(time_interval))
    #logger.debug(str(time_a_s)+' -> '+str(time_b_s))
    #logger.debug('time interval '+str(time_interval))

    upper = HVAC_vars.tmax
    lower = HVAC_vars.tmin
    if time_interval >= upper:
        score = 0
    elif time_interval <= lower:
        score = 1
    else:
        score = (lower / time_interval) ** HVAC_vars.a_t

    #print ('score '+str(score))
    return os,oe,source_index,dest_index,source_TI,dest_TI,source_time,dest_time,score

def calc_categorical_corr_HVAC(event_a, event_b):
    stamp1 = event_a['C']
    stamp2 = event_b['C']

    flags = [0,0]
    if stamp1[0] == stamp2[0] and stamp1[0] != 'Null' and stamp2[0] != 'Null':flags[0]=1
    if stamp1[1] == stamp2[1] and stamp1[1] != 'Null' and stamp2[1] != 'Null':flags[1]=1
    if flags[0]==1 and flags[1]==1:return space_corr.zone
    elif flags[0]==1:return space_corr.floor
    else:return 0

def getEventID(event):
    id_str = event['I']+'__'+event['C'][1]+'__'+str(event['TimeIndex'])
    return id_str

def calc_sensor2sensor_correlation(sensor_data):
    mixed_data = list(itertools.product(sensor_data, sensor_data)) 
    result=[]
    print ('calculating sensor2sensor correaltion')
    print ('sensor data length '+str(len(sensor_data)))
    print ('mixed data length '+str(len(mixed_data)))

    calculatedPair = {}

    bar = Bar('Loading', fill='@',suffix='%(percent)d%% %(avg).3fs', max=len(mixed_data))
    for event_a, event_b in mixed_data:
        #print event_a,event_b
        if event_a['I']==event_b['I']:
            bar.next()
            continue
        cur_pair_a = getEventID(event_a)+'__'+getEventID(event_b)
        cur_pair_b = getEventID(event_b)+'__'+getEventID(event_a)
        if (cur_pair_a in calculatedPair) or (cur_pair_b in calculatedPair):
            bar.next()
            continue
        else:
            calculatedPair[cur_pair_a]=1
            calculatedPair[cur_pair_b]=1
        spatial_corr_value = calc_space_corr_HVAC(event_a['S'],event_b['S'])
        if spatial_corr_value == 0:
            bar.next()
            continue
        pair_start_time,pair_end_time,source,dest,sourceTI,destTI,source_time,dest_time,temporal_corr_value = calc_tempora_corr(event_a,event_b)
        if temporal_corr_value == 0:
            bar.next()
            continue
        categorical_corr_value = calc_categorical_corr_HVAC(event_a,event_b)
        high_order_corr_value_absolute = temporal_corr_value + spatial_corr_value
        high_order_corr_relative = high_order_corr_value_absolute / 1.5

        source_visual_time = {'start': translate_datetime_string_to_visual_time_format(source_time['start']), 'end': translate_datetime_string_to_visual_time_format(source_time['end'])}
        dest_visual_time = {'start': translate_datetime_string_to_visual_time_format(dest_time['start']), 'end': translate_datetime_string_to_visual_time_format(dest_time['end'])}

        data_genre = 'measurement' 
        result.append({'data_genre': data_genre,
                           'source': source,
                           'sourceTimeIndex': sourceTI,
                           'sourceTime':source_visual_time,
                           'target': dest,
                           'targetTimeIndex': destTI,
                           'targetTime': dest_visual_time,
                           'temporalValue': temporal_corr_value,
                           'spatialValue': spatial_corr_value,
                           'categoricalValue': categorical_corr_value,
                           'weightAbsolute': high_order_corr_value_absolute,
                           'weightRelative': high_order_corr_relative,
                           'TimeStart': pair_start_time,
                           'TimeEnd': pair_end_time
                           })
        bar.next()
    bar.finish()
    return result

def correlation_data_format_reform(data,corr_type):
    unique_edge_list = pd.unique([(e['source'],e['target']) for e in data])
    unique_anomaly = pd.unique([e['weightAbsolute'] for e in data])
    data_genre=corr_type
    correlation_visual_record_list=[]

    print ('reforming data format')
    bar = Bar('Loading', fill='@',suffix='%(percent)d%% %(avg).3fs', max=len(unique_edge_list))
    for source,target in unique_edge_list:
        record_data = [ t for t in data if t['source'] == source and t['target']==target ]
        #print (source + '->' + target + ' record len ' + str(len(record_data)))

        record_data.sort(key=lambda x: x['TimeStart'], reverse=False)
        for record in record_data:
            record['TimeStart'] = translate_datetime_string_to_visual_time_format(str(record['TimeStart']))
            record['TimeEnd'] = translate_datetime_string_to_visual_time_format(str(record['TimeEnd']))

        correlation_record = {"source": source, \
                  "target": target, \
                  'EdgeType': data_genre, \
                  "timeSeries": record_data\
                  }

        correlation_visual_record_list.append(correlation_record)
        bar.next()
    bar.finish()
    return correlation_visual_record_list

def calc_space_corr_mixed(stamp1,stamp2,genrei,genrej): # stamp = [floor, zone, room]
    map_m2h = get_map_m2h()
    map_h2m = get_map_h2m()
    flags = [0,0]
    if genrei == 'm':
        if stamp1[0] == 'F3' and stamp1[1] == 'Z7': return space_corr.zone
    elif genrej == 'm':
        if stamp2[0] == 'F3' and stamp2[1] == 'Z7': return space_corr.zone

    if stamp1[0] == stamp2[0] and stamp1[0] != 'Null' and stamp2[0] != 'Null':
        flags[0]=1
        if stamp2[1] == 'Null' or stamp1[1] == 'Null':
            pass
        else:
            if genrei == 'm':
                zone_1 = map_m2h[stamp1[0]]
                transition_zone_list = zone_1[stamp1[1]]
                if stamp2[1] in transition_zone_list:
                    flags[1] = 1
            elif genrej == 'm':
                zone_1 = map_m2h[stamp2[0]]
                transition_zone_list = zone_1[stamp2[1]]
                if stamp1[1] in transition_zone_list:
                    flags[1] = 1
    if flags == [1,1]: return space_corr.zone
    elif flags == [1,0]: return space_corr.floor
    elif flags == [0,0]: return 0

def get_map_h2m():
    result = { \
        'F1':{
            'Z1': ['Z2'],
            'Z2': ['Z5'],
            'Z3': ['Z1'],
            'Z4': ['Z7','Z8'],
            'Z5': ['Z6'],
            'Z6': ['Z4'],
            'Z7': ['Z3'],
            'Z8A':['Z1'],
            'Z8B':['Z1']
            },
        'F2':{
            'Z1': ['Z2'],
            'Z2': ['Z1','Z2','Z3','Z7'],
            'Z3': ['Z7'],
            'Z4': ['Z6','Z7'],
            'Z5': ['Z6'],
            'Z6': ['Z1','Z2','Z6'],
            'Z7': ['Z2'],
            'Z8': ['Z2'],
            'Z9': ['Z1','Z2','Z5'],
            'Z10':['Z1','Z7'],
            'Z11':['Z7'],
            'Z12A':['Z1'],
            'Z12B':['Z1'],
            'Z12C':['Z1'],
            'Z13':['Z4'],
            'Z14':['Z6'],
            'Z15':['Z7'],
            'Z16':['Z6']
            },
        'F3':{
            'Z1': ['Z6'],
            'Z2': ['Z1','Z2','Z6'],
            'Z3': ['Z1','Z2'],
            'Z4': ['Z4'],
            'Z5': ['Z2'],
            'Z6': ['Z1','Z2','Z3'],
            'Z7': ['Z3'],
            'Z8': ['Z3'],
            'Z9': ['Z1','Z3','Z7'],
            'Z10': ['Z3'],
            'Z11A': ['Z1'],
            'Z11B': ['Z1'],
            'Z11C': ['Z1'],
            'Z12': ['Z5']
            }
        }
    return result

def get_map_m2h():
    result = { \
        'F1':{ \
            'Z1':['Z8A', 'Z8B', 'Z3'], \
            'Z2':['Z1'], \
            'Z3':['Z7'], \
            'Z4':['Z6'], \
            'Z5':['Z2'], \
            'Z6':['Z5'], \
            'Z7':['Z4'], \
            'Z8':['Z4']},
        'F2':{ \
            'Z1':['Z2','Z9','Z12A','Z10','Z12B','Z12C','Z6'], \
            'Z2':['Z1','Z2','Z6','Z7','Z9'], \
            'Z3':['Z2'], \
            'Z4':['Z13'], \
            'Z5':['Z9'], \
            'Z6':['Z4','Z5','Z6','Z14','Z16'], \
            'Z7':['Z2','Z3','Z4','Z11','Z15']},
        'F3':{
            'Z1':['Z2','Z11A','Z11B','Z11C','Z6','Z9'], \
            'Z2':['Z2','Z3','Z5','Z6'], \
            'Z3':['Z6','Z7','Z8','Z9','Z10'], \
            'Z4':['Z4'], \
            'Z5':['Z12'], \
            'Z6':['Z1','Z2'], \
            'Z7':['Z9']}
        }
    return result

def show_mov_event(event):
    content = str(event['T'][0])+' -> '+str(event['T'][1])+'\n'
    content += 'employee '+event['C'][3]+'_'+event['S'][0]+'-'+event['S'][1]
    return content
    
def show_hvac_event(event):
    content = str(event['T'][0])+' -> '+str(event['T'][1])+'\n'
    content += event['S'][0]+'-'+event['S'][1]+' -> '+event['ID']
    return content

def calc_sensor2move_correlation(move_data,sensor_data):
    mixed_data = list(itertools.product(move_data, sensor_data)) 
    print ('move data length: '+str(len(move_data)))
    print ('sensor data length: '+str(len(sensor_data)))
    print ('mix data length: '+str(len(mixed_data)))
    result=[]
    print ('calculating sensor2move correaltion')
    bar = Bar('Loading', fill='@',suffix='%(percent)d%% %(avg).3fs', max=len(mixed_data))
    selected_person='pyoung001'
    selected_zone='F3-Z9'
    for event_a, event_b in mixed_data:
        #if not (event_a['C'][3] == selected_person and event_b['ID']==selected_zone):
        #    continue
        #print ('event_a '+str(event_a))
        #print ('event_b '+str(event_b))
        spatial_corr_value = calc_space_corr_mixed(event_a['S'],event_b['S'],'m','h')
        if event_a['C'][3] == selected_person and event_b['ID']== selected_zone and spatial_corr_value!=0:
            logger.debug(show_mov_event(event_a))
            logger.debug(show_hvac_event(event_b))
            logger.debug('spatial_corr score: '+str(spatial_corr_value))
        if spatial_corr_value == 0:
            bar.next()
            continue

        pair_start_time,pair_end_time,source,dest,sourceTI,destTI,source_time,dest_time,temporal_corr_value = calc_tempora_corr(event_a,event_b)
        if event_a['C'][3] == selected_person and event_b['ID']== selected_zone and temporal_corr_value!=0:
            logger.debug('temporal_corr_value: '+str(temporal_corr_value))
        if temporal_corr_value == 0:
            bar.next()
            continue

        categorical_corr_value = calc_categorical_corr_HVAC(event_a,event_b)
        high_order_corr_value_absolute = temporal_corr_value + spatial_corr_value
        high_order_corr_relative = high_order_corr_value_absolute / 1.1
        if event_a['C'][3] == selected_person and event_b['ID']== selected_zone and temporal_corr_value!=0:
            logger.debug('sensor type :'+str(event_b['C'][1]))
            logger.debug('corr_relative: '+str(high_order_corr_relative))

        source_visual_time = {'start': translate_datetime_string_to_visual_time_format(source_time['start']), 'end': translate_datetime_string_to_visual_time_format(source_time['end'])}
        dest_visual_time = {'start': translate_datetime_string_to_visual_time_format(dest_time['start']), 'end': translate_datetime_string_to_visual_time_format(dest_time['end'])}

        data_genre = 'measurement'
        result.append({'data_genre': data_genre,
                           'source': source,
                           'sourceTimeIndex': sourceTI,
                           'sourceTime':source_visual_time,
                           'target': dest,
                           'targetTimeIndex': destTI,
                           'targetTime': dest_visual_time,
                           'temporalValue': temporal_corr_value,
                           'spatialValue': spatial_corr_value,
                           'categoricalValue': categorical_corr_value,
                           'weightAbsolute': round(high_order_corr_value_absolute,2),
                           'weightRelative': round(high_order_corr_relative,2),
                           'TimeStart': pair_start_time,
                           'TimeEnd': pair_end_time
                           })
        bar.next()
    bar.finish()
    return result

def calc_correlation(sensor_data,move_data,hvac_filter,move_filter):
    sensor_corr_path = OUTPUT_PREFIX+'sensor_correlation_h'+str(hvac_filter)+'.json'
    if not os.path.exists(sensor_corr_path):
        result = calc_sensor2sensor_correlation(sensor_data)
        correlation_visual_record_list = correlation_data_format_reform(result,'measurement')
        json.dump(correlation_visual_record_list,open(sensor_corr_path,'w'),indent=4,sort_keys=True)
    else: 
        correlation_visual_record_list = json.load(open(sensor_corr_path))

    s2s_edge_list = correlation_visual_record_list

    sensor_move_corr_path = OUTPUT_PREFIX+'sensor2movement_correlation_h'+str(hvac_filter)+'_m'+str(move_filter)+'.json'
    if not os.path.exists(sensor_move_corr_path):
        print('calculating sensor2move correlation')
        result = calc_sensor2move_correlation(move_data,sensor_data)
        correlation_visual_record_list = correlation_data_format_reform(result,'mixed')
        json.dump(correlation_visual_record_list,open(sensor_move_corr_path,'w'),indent=4,sort_keys=True)
    else: 
        correlation_visual_record_list = json.load(open(sensor_move_corr_path))
    correlation_visual_record_list += s2s_edge_list
    return correlation_visual_record_list

def visual_move_data_to_compact_form(mov_data):
    mov_data = mov_data.values()
    local_anomaly_info_list=[]
    ID=0
    for mov_item in mov_data:
        time_series = mov_item['timeSeries']
        department = mov_item['categories']['department']
        employeeName = mov_item['categories']['employeeNmae']
        proxID = mov_item['categories']['proxID']
        nodeIndex = mov_item['nodeIndex']
        time_index=0
        for event in time_series:
            anomaly_info={}
            anomaly_info['A']=event['weight']
            anomaly_info['C']=['movement',department,employeeName,proxID]
            anomaly_info['S']=[event['SpaceFloor'],event['SpaceZone'],event['SpaceRoom']]
            if event['T_end'] == 'EOD':
                continue
            year=2016
            month=6
            start_time = event['T_start'].split(':')
            start_time = [int(e) for e in start_time]
            if start_time[0]==1:
                month=5
                start_time[0]=31
            else:
                start_time[0]-=1
            start_time = [year,month]+start_time
            
            month=6
            end_time = event['T_end'].split(':')
            end_time = [int(e) for e in end_time]
            if end_time[0]==1:
                month=5
                end_time[0]=31
            else:
                end_time[0]-=1
            end_time = [year,month]+end_time

            anomaly_info['T']= [start_time,end_time]
            anomaly_info['V']=event['Variable']
            anomaly_info['TimeIndex']=time_index
            anomaly_info['ID']=nodeIndex
            anomaly_info['I']=nodeIndex
            time_index += 1
            ID+=1
            local_anomaly_info_list.append(anomaly_info)
    return local_anomaly_info_list

def main():
    gen_id_info()

    anomaly_event_path = traffic_feature_anomaly_detect_by_zone(DATA_PATH)

    #drop_database(DB_TABLE_NAME)
    mov_dict = load_mov_data()
    mov_edge_dict = load_mov2mov_data()

    sensor_data_all = anomaly_events_reform_for_analysis(anomaly_event_path)

    for move_filter in range(25,50,5):
    #for move_filter in range(40,45,5):
        move_data = mov_dict[str(move_filter)]
        move_events = visual_move_data_to_compact_form(move_data)
        move_edge_data = mov_edge_dict[str(move_filter)]
        print ('mov filter value '+str(move_filter))
        for filter_value in range(20,100,10):
        #for filter_value in range(40,50,10):
            print ('filter value '+str(filter_value))
            sensor_data = filter_events(sensor_data_all,filter_value)
            analytical_events_to_visual_database(sensor_data,filter_value,move_filter,move_data)
            record_list = calc_correlation(sensor_data,move_events,filter_value,move_filter)
            record_list += move_edge_data
            edge_collection_name='edge_filtered_h'+str(filter_value)+'_m'+str(move_filter)
            save_to_database(DB_TABLE_NAME,record_list,edge_collection_name)

space_corr = space_corr_params(0.02, 0.2, 1)
HVAC_vars = HVAC_VAR(15 * 60, 180 * 60, 1, 0.5)

if __name__ == '__main__':
    start_time = time.time()
    config_logger()
    main()
    end_time = time.time()
    print('task done in '+str(round(end_time-start_time,2))+'s')
