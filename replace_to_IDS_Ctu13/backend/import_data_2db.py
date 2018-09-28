# -*- coding:utf-8 -*-
from pymongo import MongoClient
import time


def import_binetflow(input_path='./capture20110817.binetflow', collection_name='scenario_10_ex'):
    db_name = 'ctu13_raw_data'

    client = MongoClient('127.0.0.1', 27017)
    db = client['admin']
    db.authenticate('root', 'vis_ali_mongo', mechanism='SCRAM-SHA-1')
    db = client[db_name]
    collection = db[collection_name]

    with open(input_path) as f:
        titles = f.readline()
        titles = titles.strip().split(',')
        # StartTime,Dur,Proto,SrcAddr,Sport,Dir,DstAddr,Dport,State,sTos,dTos,TotPkts,TotBytes,SrcBytes,Label
        titles.append('start_timestamp')
        titles.append('end_timestamp')
        titles.append('start_serial_1min')
        titles.append('end_serial_1min')

        post_datas = []
        netflow_count = 0
        for each_line in f:
            datas = each_line.replace('\n', '').split(',')
            timeArray = time.strptime(datas[0].split('.')[0], "%Y/%m/%d %H:%M:%S")  # 取整数秒数
            start_timestamp = time.mktime(timeArray) + float('0.' + datas[0].split('.')[1])
            end_timestamp = start_timestamp + float(datas[1])
            datas.append(start_timestamp)
            datas.append(end_timestamp)
            datas.append(int(start_timestamp / 60))
            datas.append(int(end_timestamp / 60))

            post_data = dict()
            for i in range(len(titles)):
                post_data[titles[i]] = datas[i]
            post_datas.append(post_data)
            netflow_count += 1
            if netflow_count % 10000 == 0:
                print 'finished record:', netflow_count
                collection.insert_many(post_datas)
                post_datas = []
        print 'finished record:', netflow_count
        collection.insert_many(post_datas)


def import_feature_info(input_path='./feature_info_src_60s.csv', collection_name='scenario_10_feature_src_dst'):
    """注意,csv第一行需要是title
    time,host_ip,protocol,dest_port,NHP,NH,ANF,NF,NP,NB,ND,cor_ip_list"""
    db_name = 'ctu13_feature_data'

    client = MongoClient('127.0.0.1', 27017)
    db = client['admin']
    db.authenticate('root', 'vis_ali_mongo', mechanism='SCRAM-SHA-1')
    db = client[db_name]
    collection = db[collection_name]

    with open(input_path) as f:
        titles = f.readline()
        titles = titles.strip().split(',')
        titles.append('start_minute')
        titles.append('start_timestamp')
        post_datas = []
        netflow_count = 0
        for each_line in f:
            datas = each_line.replace('\n', '').replace('\r', '').split(',')
            datas[0] = datas[0].split('.')[0]
            datas.append(datas[0][0:-2] + '00')
            timeArray = time.strptime(datas[0], "%Y-%m-%d %H:%M:%S")
            start_timestamp = time.mktime(timeArray)
            datas.append(start_timestamp)

            post_data = dict()
            for i in range(len(titles)):
                post_data[titles[i]] = datas[i]
            post_datas.append(post_data)
            netflow_count += 1
            if netflow_count % 1000 == 0:
                print 'finished record', netflow_count
                collection.insert_many(post_datas)
                post_datas = []
        collection.insert_many(post_datas)
        print 'finished record', netflow_count


PREFIX='/opt/disk/vis_sec/CTU13/CTU-13-Dataset/10/'
#import_binetflow(PREFIX+'capture20110818.binetflow')
import_feature_info(PREFIX+'output/feature_info_src_60s.csv')
import_feature_info(PREFIX+'output/feature_info_dest_60s.csv')
