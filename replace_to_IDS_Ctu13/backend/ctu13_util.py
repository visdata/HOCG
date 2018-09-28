# -*- coding:utf8 -*-
import os,sys
import pandas as pd
import numpy as np
import math
import time
import datetime
from collections import Counter
from Util import dict_to_sorted_list,logger,config_logger
import scipy.stats
from visualize import scatter_vis
from scapy.all import rdpcap

import json

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
# scenario 1 mean 4 var 34
num=10
PATH = '/opt/disk/vis_sec/CTU13/CTU-13-Dataset/'+str(num)+'/'+FILENAME_MAP[num]
OUTPUT_PREFIX='/opt/disk/vis_sec/CTU13/CTU-13-Dataset/'+str(num)+'/output/'

NORMAL_START_DATE = datetime.datetime(2011,8,18,10,0,0)
NORMAL_END_DATE = datetime.datetime(2011,8,18,11,0,0)

TIME_FEATURE_NAME='StartTime'

def read_ctu13_data(path): 
    time_feature_name=TIME_FEATURE_NAME
    data = pd.read_csv(path, parse_dates=[time_feature_name], date_parser=lambda epoch: pd.to_datetime(epoch, format='%Y/%m/%d %H:%M:%S.%f'))

    # switch source and destination of direction is '<--'
    select_indices = list(np.where(data.Dir=='  <-')[0])
    src_list = data.iloc[select_indices,data.columns.get_loc('SrcAddr')].tolist()
    dest_list = data.iloc[select_indices,data.columns.get_loc('DstAddr')].tolist()
    data.iloc[select_indices,data.columns.get_loc('SrcAddr')]=dest_list
    data.iloc[select_indices,data.columns.get_loc('DstAddr')]=src_list

    data.set_index([time_feature_name],inplace=True)
    data.sort_index(inplace=True) 
    return data

def read_ctu13_data_without_timeindex(path): 
    data = pd.read_csv(path, parse_dates=[TIME_FEATURE_NAME], date_parser=lambda epoch: pd.to_datetime(epoch, format='%Y/%m/%d %H:%M:%S.%f'))
    data['SrcBytes'] = data['SrcBytes'].astype('float64').fillna(0.0) 
    data.sort_values(by=TIME_FEATURE_NAME,inplace=True)
    if(data.isnull().values.any()):
        print 'NaN value found in this dataset '+path
	#print data.isnull().any()
    return data

def read_ctu13_data_chunk(path,chunk_size): 
    time_feature_name='StartTime'
    return pd.read_csv(path,index_col=0, parse_dates=[time_feature_name], date_parser=lambda epoch: pd.to_datetime(epoch, format='%Y/%m/%d %H:%M:%S.%f'),chunksize=chunk_size)

def get_features_for_single_ip_as_src_from_data(t_data,ip):
    current_time = t_data.index[0]
    # NHP_S
    ip_src_data = t_data[t_data.SrcAddr==ip]
    unique_dest_ip_port = pd.unique(zip(ip_src_data.DstAddr,ip_src_data.Dport))
    NHP_S_feature = len(unique_dest_ip_port)
    #print 'NHP_S for host '+ip+' at time '+str(current_time)+' is '+str(NHP_S_feature)

    # NH_S
    unique_ip = pd.unique(ip_src_data.DstAddr)
    NH_S_feature = len(unique_ip)
    CORR_IP_LIST = '#'.join(unique_ip)

    # ANF_S
    if NH_S_feature!=0:
        ANF_S_feature = (ip_src_data.shape[0]+0.0)/NH_S_feature
    else:
        ANF_S_feature = 0

    #NF_S
    NF_S_feature = ip_src_data.shape[0]

    #NP_S
    NP_S_feature = np.sum(ip_src_data['TotPkts'])

    #NB_S
    NB_S_feature = np.sum(ip_src_data['SrcBytes'])

    #ND_S
    ND_S_feature = round((np.sum(ip_src_data['Dur'])/NH_S_feature),2)

    ip_features_list = [NHP_S_feature,NH_S_feature,ANF_S_feature,NF_S_feature,NP_S_feature,NB_S_feature,ND_S_feature,CORR_IP_LIST]

    return ip_features_list

def get_features_for_single_ip_as_dest_from_data(t_data,ip):
    #print 'get features for ip '+ip
    current_time = t_data.index[0]

    # NHP_D
    ip_dest_data = t_data[t_data.DstAddr==ip]
    unique_source_ip_port = pd.unique(zip(ip_dest_data.SrcAddr,ip_dest_data.Sport))
    NHP_D_feature = len(unique_source_ip_port)
    #print 'NHP_D for host '+ip+' at time '+str(current_time)+' is '+str(NHP_D_feature)

    # NH_D
    unique_ip = pd.unique(ip_dest_data.SrcAddr)
    NH_D_feature = len(unique_ip)

    CORR_IP_LIST = '#'.join(unique_ip)

    # ANF_D
    if NH_D_feature!=0:
        ANF_D_feature = (ip_dest_data.shape[0]+0.0)/NH_D_feature
    else:
        ANF_D_feature = 0

    #NF_D
    NF_D_feature = ip_dest_data.shape[0]

    #NF
    #NF_feature = NF_S_feature + NF_D_feature

    #NP_D
    NP_D_feature = np.sum(ip_dest_data['TotPkts'])

    #NB_D
    #NB_D_feature = np.sum(ip_dest_data['TotBytes']-ip_dest_data['SrcBytes'])
    NB_D_feature = np.sum(ip_dest_data['SrcBytes'])

    #ND_D
    ND_D_feature = round((np.sum(ip_dest_data['Dur'])/NH_D_feature),2)

    ip_features_list = [NHP_D_feature,NH_D_feature,ANF_D_feature,NF_D_feature,NP_D_feature,NB_D_feature,ND_D_feature,CORR_IP_LIST]
    return ip_features_list

def extract_ctu13_features(cur_time,t_data,prot,port='None'):
    src_list=[]
    dest_list=[]
    if prot == 'icmp':
        s_list,d_list = extract_ctu13_icmp_features(cur_time,t_data)
    elif prot == 'udp':
    	s_list,d_list = extract_ctu13_udp_features(cur_time,t_data,port)
    elif prot == 'tcp':
        s_list,d_list = extract_ctu13_tcp_features(cur_time,t_data,port)
    src_list += s_list
    dest_list += d_list
    return src_list,dest_list

UDP_PORT_FILTERING_LIST=[53]

def extract_ctu13_udp_features(current_time,t_data,port='None'):
    t_data = t_data[t_data.Proto == 'udp']
    #t_data = t_data[~t_data.Dport.isin(UDP_PORT_FILTERING_LIST)] 
    t_data = t_data[~(t_data.Dport=='53')] 

    if port != 'None':
        t_data = t_data[t_data.Dport == str(port)]
    if t_data.shape[0]==0:
        return [],[]
    unique_ip_list = pd.unique(t_data['SrcAddr'])
    src_host_record_list =[]
    #current_time = t_data.index[0]
    for ip in unique_ip_list:
        #if ip_is_bn_network(ip):
        #    continue
	#t_data = t_data[t_data.State == 'INT']
        record = get_features_for_single_ip_as_src_from_data(t_data,ip)
        record = [current_time,ip,'udp',str(port)]+record
        src_host_record_list.append(record)

    unique_ip_list = pd.unique(t_data['DstAddr'])
    dest_host_record_list =[]
    for ip in unique_ip_list:
        #if ip_is_bn_network(ip):
        #    continue
	#t_data = t_data[t_data.State == 'INT']
        record = get_features_for_single_ip_as_dest_from_data(t_data,ip)
        record = [current_time,ip,'udp',str(port)]+record
        dest_host_record_list.append(record)
    return src_host_record_list,dest_host_record_list

def extract_ctu13_icmp_features(current_time,t_data):
    t_data = t_data[t_data.Proto == 'icmp']
    if t_data.shape[0]==0:
        return [],[]
    unique_ip_list = pd.unique(t_data['SrcAddr'])
    src_host_record_list =[]
    #current_time = t_data.index[0]
    for ip in unique_ip_list:
        #if ip_is_bn_network(ip):
        #    continue
	#t_data = t_data[t_data.State == 'INT']
        record = get_features_for_single_ip_as_src_from_data(t_data,ip)
        record = [current_time,ip,'icmp','None']+record
        src_host_record_list.append(record)

    unique_ip_list = pd.unique(t_data['DstAddr'])
    dest_host_record_list =[]
    for ip in unique_ip_list:
        #if ip_is_bn_network(ip):
        #    continue
	#t_data = t_data[t_data.State == 'INT']
        record = get_features_for_single_ip_as_dest_from_data(t_data,ip)
        record = [current_time,ip,'icmp','None']+record
        dest_host_record_list.append(record)
    return src_host_record_list,dest_host_record_list

def extract_ctu13_tcp_features(current_time,t_data,dest_port=25):
    #t_data = t_data[t_data.Dir == '   ->']
    t_data = t_data[t_data.Dport == str(dest_port)]
    #print (t_data.shape)
    if t_data.shape[0]==0:
        return [],[]
    unique_ip_list = pd.unique(t_data['SrcAddr'])
    src_host_record_list =[]
    #current_time = t_data.index[0]
    for ip in unique_ip_list:
        #if ip_is_bn_network(ip):
        #    continue
	#t_data = t_data[t_data.State == 'INT']
        record = get_features_for_single_ip_as_src_from_data(t_data,ip)
        record = [current_time,ip,'tcp',dest_port]+record
        src_host_record_list.append(record)

    unique_ip_list = pd.unique(t_data['DstAddr'])
    dest_host_record_list =[]
    for ip in unique_ip_list:
        #if ip_is_bn_network(ip):
        #    continue
	#t_data = t_data[t_data.State == 'INT']
        record = get_features_for_single_ip_as_dest_from_data(t_data,ip)
        record = [current_time,ip,'tcp',dest_port]+record
        dest_host_record_list.append(record)
    return src_host_record_list,dest_host_record_list

def read_groundtruth():
    path = PATH
    data = read_ctu13_data(path)
    data = data[data.Label.str.contains('Botnet')]
    data = data[data.Proto=='tcp']
    spam_data = data[data.Dport == '25']
    logger.debug('Spam Attacker IPs')
    unique_attacker = Counter(spam_data.SrcAddr)
    logger.debug(dict_to_sorted_list(unique_attacker))
    logger.debug('Spam Victim IPs')
    unique_spam_victims= Counter(spam_data.DstAddr)
    logger.debug(dict_to_sorted_list(unique_spam_victims))

    cf_data = data[data.Dport=='80']
    logger.debug('ClickFraud Attacker IPs')
    unique_cf_attacker = Counter(cf_data.SrcAddr)
    logger.debug(dict_to_sorted_list(unique_cf_attacker))
    logger.debug('ClickFraud Victim IPs')
    unique_cf_victims= Counter(cf_data.DstAddr)
    logger.debug(dict_to_sorted_list(unique_cf_victims))

    irc_data = data[data.Dport=='6667']
    logger.debug('IRC channel connector IPs')
    unique_irc_user = Counter(irc_data.SrcAddr)
    logger.debug(dict_to_sorted_list(unique_irc_user))
    logger.debug('IRC channel server IPs')
    unique_irc_server = Counter(irc_data.DstAddr)
    logger.debug(dict_to_sorted_list(unique_irc_server))
    return unique_attacker,unique_spam_victims,unique_cf_attacker,unique_cf_victims,unique_irc_user,unique_irc_server

def udp_test():
    #path = '/opt/disk/vis_sec/CTU13/CTU-13-Dataset/1/capture20110810.binetflow'
    #path = '/opt/disk/vis_sec/CTU13/CTU-13-Dataset/9/capture20110817.binetflow'
    data = read_ctu13_data_without_timeindex(PATH)
    data = data[data.Proto=='udp']
    mask = (data[TIME_FEATURE_NAME] > NORMAL_START_DATE) & (data[TIME_FEATURE_NAME] <= NORMAL_END_DATE)
    normal_data = data.loc[mask]
    desc = scipy.stats.describe(normal_data.SrcBytes)
    print normal_data.loc[[np.argmax(normal_data['SrcBytes'])]]
    print np.mean(normal_data['SrcBytes'])
    print np.median(normal_data['SrcBytes'])
    print np.var(normal_data['SrcBytes'])
    print desc
    desc = scipy.stats.describe(data.SrcBytes)
    #print data.iloc[data['SrcBytes'].argmax()]
    print desc
    #data = data[~data.Dir.str.contains('\?')]
    data = data[data.Proto=='udp']
    print 'UDP histogram'

    unique_port_list = list(pd.unique(data.Dport))
    #print unique_port_list

    #unique_sip_dport = Counter(zip(data.SrcAddr,data.Dport))
    unique_dport = Counter(data.Dport)
    for port, count in unique_dport.most_common():
	if count < 100:
		break
        print (str(port)+' : '+str(count))
        port_data = data[data.Dport==str(port)]
        unique_s_ip = Counter(port_data.SrcAddr)
	#for ip,ip_count in unique_s_ip.most_common():
        #	print ('\t'+str(ip)+' : '+str(ip_count))
        #unique_sip_dport = Counter(zip(data.SrcAddr,data.Dport))
    #print len(unique_port_list)
    #print (data.head(2))

def tcp_test():
    data = read_ctu13_data_without_timeindex(PATH)
    #data = data[~data.Dir.str.contains('\?')]
    mask = (data[TIME_FEATURE_NAME] > NORMAL_START_DATE) & (data[TIME_FEATURE_NAME] <= NORMAL_END_DATE)
    normal_data = data.loc[mask]
    data = data[data.Proto=='tcp']
    #data = data[data.Dport=='6667']
    desc = scipy.stats.describe(data.Dur)
    print desc
    desc = scipy.stats.describe(normal_data.Dur)
    print desc
    #scatter_vis(data.index.values,data.Dur,'tcp_duration',OUTPUT_PREFIX,False,True)

def sort_data_by_time():
    time_feature_name='StartTime'
    data = pd.read_csv(PATH, parse_dates=[time_feature_name], date_parser=lambda epoch: pd.to_datetime(epoch, format='%Y/%m/%d %H:%M:%S.%f'))
    data.sort_values(by=time_feature_name,inplace=True)
    OUTPATH = '/opt/disk/vis_sec/CTU13/CTU-13-Dataset/'+str(num)+'/sorted_'+FILENAME_MAP[num]
    data.to_csv(OUTPATH,index=False);

def read_raw_pcap_file():
    pcap_filepath = ''
    r = rdpcap(pcap_filepath) 

def main():
    print ('ctu13 challenge')
    #tcp_test()
    #read_groundtruth()    
    #sort_data_by_time()
    udp_test()

if __name__ == '__main__':
    main()
