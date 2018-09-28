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

from Util import save_to_database,drop_database,append_list_to_csv,logger,config_logger,pretty_print,EVT_score_compute_by_vector,gmm_fit,query_db

SENSOR_DATA_PATH='anomaly_graph4.node_filtered_h25_m25.json'

nodeIndex2InfoMap={}
oldNodeIndex2TypeMap={}

def reshape_edge(database_name,collection_name):
    global nodeIndex2InfoMap
    global oldNodeIndex2TypeMap
    edge_data = query_db(database_name,collection_name)
    #print (edge_data)
    edge_map={}
    for row in edge_data:
        row.pop('_id',None)
        edgeType = row['EdgeType']
        source = row['source']
        target = row['target']
        if edgeType == 'movement':
            key = source+'_'+target
            edge_map[key]=row
            continue
        #print (source+' -> '+target)
        new_source = source
        new_target = target
        if source.startswith('h'):
            new_source = nodeIndex2InfoMap[source]
        if target.startswith('h'):
            new_target = nodeIndex2InfoMap[target]
        row['source']=new_source
        row['target']=new_target
        if new_source == new_target:
            continue
        original_port_pair = [oldNodeIndex2TypeMap[source] if source in oldNodeIndex2TypeMap else 'None',oldNodeIndex2TypeMap[target] if target in oldNodeIndex2TypeMap else 'None']
        key = new_source+'_'+new_target
        for x in row['timeSeries']:
            x['port']=original_port_pair
        if not key in edge_map:
            edge_map[key]=row
        else:
            existing_record = edge_map[key]
            existing_record['timeSeries']+=row['timeSeries']
    edge_list = list(edge_map.values())
    return edge_list

def reshape_node(database_name,collection_name):
    global nodeIndex2InfoMap
    global oldNodeIndex2TypeMap
    sensor_data = query_db(database_name,collection_name)
    #print (sensor_data)

    sensor_node_info_list={}
    movement_node_info_list={}
    features_list=[]
    for row in sensor_data:
        row.pop('_id',None)
        nodename = row['nodeName']

        if row['dataType'] == 'measurement':
            key = nodename
            key_array = key.split('_')
            feature = key_array[0].strip()
            if feature not in features_list:
                features_list.append(feature)
            zone = key_array[1].strip()

            row['nodeName'] = feature
            if zone not in sensor_node_info_list:
                sensor_node_info_list[zone]=[row]
            else:
                sensor_node_info_list[zone].append(row)
        if row['dataType'] == 'movement':
            movement_node_info_list[nodename]=row
    print('sensor info list len: '+str(len(sensor_node_info_list)))
    print('movement info list len: '+str(len(movement_node_info_list)))
    print('sensor keys'+str(sensor_node_info_list.keys()))
    print('features '+str(features_list))

    new_node_info=[]
    for nodename, data in movement_node_info_list.items():
        for event in data['timeSeries']:
            event['port']='Human'
    for zone, data_array in sensor_node_info_list.items():
        zone_node_info={}
        zone_node_info['nodeName']=zone
        zone_node_info['OldnodeIndex']=[e['nodeIndex'] for e in data_array]
        zone_node_info['nodeIndex']=zone
        for nodeIndex in zone_node_info['OldnodeIndex']:
            nodeIndex2InfoMap[nodeIndex]=zone
        zone_node_info['dataType']=data_array[0]['dataType']
        zone_node_info['nodeFullName']='sensor data for zone '+zone
        zone_node_info['categories']=['sensor']

        time_series=[]
        for single_feature_data in data_array:
            feature_name = single_feature_data['nodeName']
            nodeIndex = single_feature_data['nodeIndex']
            oldNodeIndex2TypeMap[nodeIndex]=feature_name
            for event in single_feature_data['timeSeries']:
                new_event=event
                new_event['port']=feature_name 
                time_series.append(new_event)
        zone_node_info['timeSeries']=time_series
        new_node_info.append(zone_node_info)
    #print (new_node_info[0])

    final_result = new_node_info + list(movement_node_info_list.values())
    #print (nodeIndex2InfoMap.keys())
    return final_result

def main():
    SOURCE_DATABASE='anomaly_graph4'
    TARGET_DATABASE='vast16_graph'
    for h_limit in np.arange(25,50,5):
        for m_limit in np.arange(25,50,5):
            nodes_collection_name='node_filtered_h'+str(h_limit)+'_m'+str(m_limit)
            nodes = reshape_node(SOURCE_DATABASE,nodes_collection_name)

            edges_collection_name='edge_filtered_h'+str(h_limit)+'_m'+str(m_limit)
            edges = reshape_edge(SOURCE_DATABASE,edges_collection_name)

            #drop_database(TARGET_DATABASE)
            save_to_database(TARGET_DATABASE,nodes,nodes_collection_name)
            save_to_database(TARGET_DATABASE,edges,edges_collection_name)

if __name__ == '__main__':
    start_time = time.time()
    config_logger()
    main()
    end_time = time.time()
    print('task done in '+str(round(end_time-start_time,5))+'s')
