import os,sys
import logging
import json
import operator
import numpy as np
import scipy

from pymongo import MongoClient
from sklearn import mixture
import pymongo

LOGGER_NAME='hocg_analyze'
logger = logging.getLogger(LOGGER_NAME)

#DATABASE_IP='118.190.210.193'
DATABASE_IP='127.0.0.1'
CONN_STR = 'mongodb://root:vis_ali_mongo@'+DATABASE_IP+':27017'

def time_string_remove_day(timestr):
    return timestr.split(' ')[1]

def calculate_distance(point1,point2):
    sum_sqaure = 0.0
    for i in range(0,len(point1)):
        sum_sqaure = sum_sqaure+ (point1[i]-point2[i])**2
    return sum_sqaure**0.5

def getHocgLogger():
    return logging.getLogger(LOGGER_NAME)

def config_logger():
    logger_name=LOGGER_NAME
    logger = logging.getLogger(logger_name)
    logger.setLevel(logging.DEBUG)
    fh = logging.FileHandler(logger_name+".log",mode='a+')
    fh.setLevel(logging.DEBUG)
    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)
    #formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    formatter = logging.Formatter("%(levelname)s - %(message)s")
    ch.setFormatter(formatter)
    fh.setFormatter(formatter)
    logger.addHandler(fh)

def pretty_print(report):
    breport = json.dumps(report, indent=4, sort_keys=True)
    return breport

def query_db(database_name,collection_name):
    client = MongoClient(CONN_STR)
    db = client.anomaly_graph4
    result = db[collection_name].find()
    return result

def drop_database(database_name):
    client = MongoClient(CONN_STR)
    client.drop_database(database_name)

def save_to_database(database_name,data,collection_name):
    client = MongoClient(CONN_STR)
    db = client[database_name]
    try:
        db[collection_name].insert(data)
    except pymongo.errors.DuplicateKeyError:
        print ('Duplciate insertion')

def ip_is_server(ip):
    server_ip_prefix_list=['172.10.0','172.20.0','172.30.0']
    for ip_prefix in server_ip_prefix_list:
        if ip.startswith(ip_prefix):
            return True
    return False

def ip_is_bn_network(ip):
    server_ip_prefix_list=['172.10','172.20','172.30']
    for ip_prefix in server_ip_prefix_list:
        if ip.startswith(ip_prefix):
            return True
    return False

def ip_is_whitelist(ip):
    server_ip_prefix_list=['239.255.255.250']
    for ip_prefix in server_ip_prefix_list:
        if ip.startswith(ip_prefix):
            return True
    return False

def ensure_dir(file_path):
    directory = os.path.dirname(file_path)
    if not os.path.exists(directory):
        os.makedirs(directory)

def list_to_csv(list_to_save,filepath):
    ensure_dir(filepath)
    with open(filepath,'w') as f:
        for event_tuple in list_to_save:
            save_str = ','.join([str(e) for e in event_tuple])+'\n'
            f.write(save_str)

def append_list_to_csv(list_to_save,filepath):
    ensure_dir(filepath)
    with open(filepath,'a') as f:
        for event_tuple in list_to_save:
            save_str = ','.join([str(e) for e in event_tuple])+'\n'
            f.write(save_str)

def dict_to_sorted_list(x):
    sorted_x = sorted(x.items(), key=operator.itemgetter(1),reverse=True)
    return sorted_x

def gmm_fit(normal_data):
    #X = normal_data.reshape(len(normal_data),1)
    X = normal_data
    lowest_bic = np.infty
    n_components_range = range(1, 4)
    #cv_types = ['spherical', 'tied', 'diag', 'full']
    cv_types = ['diag']
    for cv_type in cv_types:
        for n_components in n_components_range:
            gmm = mixture.GaussianMixture(n_components=n_components,covariance_type=cv_type,reg_covar=1e-5)
            gmm.fit(X)
            bic = gmm.bic(X)
            if bic < lowest_bic:
                lowest_bic = bic
                best_gmm = gmm
    logger.debug('Best bic '+str(lowest_bic))
    logger.info('Best model components number: '+str(best_gmm.means_.shape))
    return best_gmm

def EVT_score_compute_by_vector(m_star,raw_value,mean,std_var):
    mahalanobis_distance = (np.abs(raw_value-mean)/std_var)
    h_star = mahalanobis_distance

    mean_m = np.sqrt(2*np.log(m_star))-((np.log(np.log(m_star))+np.log(2*np.pi))/(2*np.log(2*np.log(m_star))))
    std_m = np.log(2*np.log(m_star))

    y_m = (h_star - mean_m) / std_m

    p_v = np.exp(-np.exp(-y_m))

    expected_highest_anomaly_score = 1.2
    #score = np.minimum(np.eye(raw_value.shape[0]),((-np.log(1-p_v))/expected_highest_anomaly_score))    
    score = np.minimum(1,((-np.log(1-p_v))/expected_highest_anomaly_score))    
    return score

def test_evt():
    mean = 0.20938316432031406
    #mean = 0.20574385125935898
    std_var = 0.0282391437991987
    #std_var = 0.05922448804329392
    normal_data = np.random.normal(mean,std_var,5000)
    raw_value_list=[0.3379,0.3387,0.34]
    raw_value_vector = np.array(raw_value_list,dtype=np.float64)
    score = EVT_score_compute_by_vector(normal_data.shape[0],raw_value_vector,mean,std_var)
    print (score)
    gau_score = np.abs(1-(scipy.stats.norm.sf(raw_value_vector, mean, std_var)*2))
    print (gau_score)

def test_gmm():
    
    normal_X = np.array([1048, 6288, 25676, 21000, 9170, 6288, 25676, 24536, 7074, 6288, 25676, 21000, 9170, 6288, 25676, 21000, 9170, 6288, 28558, 20214, 7074, 6288, 25676, 21000, 9170, 6288, 25676, 23096, 7074, 30916, 21000, 9170, 6288, 25676, 21000, 9170, 31964, 21000, 9170, 6288, 25676, 21000, 9170, 6288, 28558, 20214, 7074, 6288, 26962, 20214, 7074, 6288, 25676, 24776, 7074, 6288, 25676, 23096, 7074, 31964, 21000, 9170, 6288, 28558, 20214, 7074, 6288, 25676, 21000, 9170, 6288, 25676, 21000, 9170, 31964, 21000, 9170, 6288, 28558, 20214, 7074, 31964, 21000, 9170, 6288, 25676, 23096, 7074, 6288, 25676, 21000, 4192, 3013, 8646, 6562, 1310, 1310, 5633, 4466, 2620, 8122, 10480, 2882, 6288, 25676, 24536, 7074, 6288, 25676, 23096, 7074, 31964, 23096, 7074, 6288, 25676, 23096, 7074, 31964, 21000, 9170, 6240, 25676, 21000, 9170, 31964, 23094, 7074, 6288, 25676, 23096, 7074, 31936, 21000, 9170, 6288, 28558, 20214, 7074, 31964, 21000, 9170, 6288, 25676, 21000, 9170, 31964, 22440, 9170, 6288, 28558, 20214, 7074, 31964, 23096, 7074, 6288, 28558, 20214, 7074, 6550, 25676, 21000, 9160, 6288, 28558, 20214, 6550, 31964, 21000, 9160, 31964, 21000, 9170, 6288, 28558, 20214, 7074, 6288, 25676, 23080, 7074, 31964, 21000, 9170, 31964, 21000, 9170, 31964, 21470, 9170, 6288, 25676, 23096, 3144, 786, 7074, 3537, 6026, 6288, 25676, 23094, 7074, 31964, 21000, 9170, 6288, 19126, 19428, 6550])
    normal_X = normal_X.reshape(len(normal_X),1)
    np.random.seed(3)
    cf = gmm_fit(normal_X)
    #test_data =np.array([0.73,0.55])
    test_data =np.array([1,1.3,2,3,4,5])
    #std_var = [std_var for e in test_data]
    print ('number of components '+str(cf.means_.shape[0]))
    print ('shape of covar '+str(cf.covariances_.shape))
    print ('mean of components '+str(cf.means_))
    print ('converged '+str(cf.converged_))
    print ('weights'+str(cf.weights_))
    label = cf.predict(test_data.reshape(len(test_data),1))
    mean = np.array([cf.means_[e][0] for e in label])
    std_var = cf.covariances_[0][0][0]
    print (test_data)
    print ('mean: '+str(mean)+' std_var: '+str(std_var))
    print (EVT_score_compute_by_vector(1000,test_data,mean,std_var))
def main():
    #test_gmm()
    test_evt()

if __name__ == '__main__':
    main()
