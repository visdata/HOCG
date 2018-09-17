# -*- coding:utf8 -*-
import os,sys
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

def visualize_histogram(data,title,output_path,bool_show=False,bool_save=False):
    plt.hist(data)
    plt.title("Histogram of "+title)
    plt.xlabel("feature")
    plt.ylabel("Frequency")
    if bool_show:
        plt.show()
    if bool_save:
        filename = title+'.png'
        plt.gcf().savefig(output_path+filename) # save the figure to file
    plt.close()

def visualize_histogram_by_service_and_feature(data,output_path,service_name,feature_name,time_begin,time_end,bool_show=False,bool_save=False):
    if service_name != 'all':
        selected_data = data[data.servicename==service_name]
    else:
        selected_data = data
    selected_data = selected_data[feature_name]
    if time_begin != 'all':
        selected_data = selected_data.between_time(time_begin,time_end)
    plt.hist(selected_data)
    title = service_name+'_'+feature_name+'_'+time_begin+'_'+time_end
    plt.title("Histogram of "+title)
    plt.xlabel("feature")
    plt.ylabel("Frequency")
    if bool_show:
        plt.show()
    if bool_save:
        plt.gcf().savefig(output_path+title) # save the figure to file
    plt.close()

def visualize_histogram_in_one_figure(data,output_path,features_dict):
    fig,subplot_list = plt.subplots(nrows=len(features_dict),figsize=(18,12))
    index=0
    for service_name , feature_name in features_dict:
        print (service_name+' : '+feature_name)
        subhist = subplot_list[index]
        if service_name != 'all':
            data_selected = data[data.servicename==service_name]
        else:
            data_selected = data
        #print data_selected.head(2)
        subhist.set_title(service_name+'_'+feature_name)
        subhist.hist(data_selected[feature_name],50,normed=1,histtype='bar',facecolor='yellowgreen',alpha=0.75)
        index+=1
    fig.subplots_adjust(hspace=4)
    #plt.show()
    fig.savefig(output_path+'feature_hist.png') # save the figure to file
    plt.close(fig)

def visualize_histogram_of_each_feature(data,features_dict):
    for service_name , feature_name in features_dict:
        visualize_histogram_by_service_and_feature(data,service_name,feature_name,'all','all','','')

def scatter_vis(X,Y,title,output_path,bool_show=False,bool_save=False):
    plt.figure(figsize=(15,10))
    plt.plot_date(x=X, y=Y)
    plt.title(title)
    if bool_show:
        plt.show()
    if bool_save:
        filename = title+'.png'
        plt.gcf().savefig(output_path+filename) # save the figure to file
    plt.close()
