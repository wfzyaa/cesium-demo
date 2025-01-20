import axios from 'axios'
import setting from '@/setting'

const baseUrl = setting.baseUrl

// create an axios instance
const service = axios.create({
    baseURL: baseUrl,
})

service.interceptors.request.use(
    config => {
        return config
    },
    error => {
        // do something with request error
        console.log(error) // for debug
        return Promise.reject(error)
    }
)

// response interceptor
service.interceptors.response.use(
    response => {
        const res = response.data
        return res
    },
    error => {
        console.log('err' + error) // for debug
        return Promise.reject(error)
    }
)

export default service