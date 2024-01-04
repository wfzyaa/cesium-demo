<template>
    <!-- :ellipsis="false" 防止最后一个图标省略 -->
    <el-menu :ellipsis="false" :default-active="activeIndex" class="el-menu-demo" mode="horizontal" router="true"
        background-color="#545c64" text-color="#fff" active-text-color="#ffd04b" @select="handleSelect">
        <div class="flex-grow" />
        <el-menu-item index="/earth">3D地球</el-menu-item>
        <!-- <el-sub-menu index="2">
            <template #title>Workspace</template>
            <el-menu-item index="2-1">item one</el-menu-item>
            <el-menu-item index="2-2">item two</el-menu-item>
            <el-menu-item index="2-3">item three</el-menu-item>
            <el-sub-menu index="2-4">
                <template #title>item four</template>
                <el-menu-item index="2-4-1">item one</el-menu-item>
                <el-menu-item index="2-4-2">item two</el-menu-item>
                <el-menu-item index="2-4-3">item three</el-menu-item>
            </el-sub-menu>
        </el-sub-menu> -->
        <el-menu-item index="/user">
            <el-icon>
                <User />
            </el-icon>
        </el-menu-item>
        <el-menu-item index="/privilege">
            <el-icon>
                <Operation />
            </el-icon>
        </el-menu-item>
    </el-menu>
</template>
<script>
export default {
    data() {
        return {
            activeIndex: '/earth',
        };
    },
    methods: {
        handleSelect(key, keyPath) {
            console.log(key, keyPath);
        }
    }
}
</script>
<style scoped>
.flex-grow {
    flex-grow: 1;
}
</style>