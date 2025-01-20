<template>
    <div id="container" class="box">
        <div class="panel">
            <span v-if="type === 0" style="font-size: 25px;">卫星名：{{ satName }}</span>
            <span v-if="type === 1" style="font-size: 25px;">地面站：{{ satName }}</span>
            <span class="panel-item">
                <span>经度(°)：</span>
                <span>{{ satData['longitude'] }}</span>
            </span>
            <span class="panel-item">
                <span>纬度(°)：</span>
                <span>{{ satData['latitude'] }}</span>
            </span>
            <span v-if="type === 0" class="panel-item">
                <span>高度(m)：</span>
                <span>{{ satData['height'] }}</span>
            </span>
            <span v-if="type === 0" class="panel-item">
                <span>速度(km/s)：</span>
                <span>{{ satData['velocity'] }}</span>
            </span>
            <span v-if="type === 0" class="panel-item">
                <span>周期(min)：</span>
                <span>{{ satData['period'] }}</span>
            </span>
        </div>
    </div>
</template>
<script>
export default {
    props: {
        satData: {
            type: Object,
            default: {},
        },
        satName: {
            type: String,
            default: null,
        },
        type: {
            type: Number,
            default: 0
        }
    },
}
</script>
<style scoped>
.box {
    width: 300px;
    background-color: rgba(156, 156, 156, 0.171);
    color: white;
    font-weight: 600;
    font-size: 20px;
    border-radius: 10px;
}

.panel {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.panel-item {
    width: 100%;
    border-radius: 10px;
    background-color: rgba(66, 66, 66, 0.308);
    display: flex;
    padding-left: 10px;
    padding-right: 10px;
    justify-content: space-between;
    margin-bottom: 10px;
}
</style>