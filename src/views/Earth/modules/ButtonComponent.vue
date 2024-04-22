<template>
    <div id="container">
        <o-tooltip :label="label" position="right">
            <button type="button" class="cesium-button cesium-toolbar-button">
                <i v-if="type" class="icon svg-sat" v-bind:class="type"></i>
            </button>
        </o-tooltip>
    </div>
</template>
<script>
import * as Cesium from "@cesium/engine"
import { Viewer } from "cesium";
export default {
    data() {
        return {
            toolbar: undefined,
            button: undefined,
            menu: undefined,
        }
    },
    props: {
        viewer: {
            type: Viewer,
            default: undefined,
        },
        type: {
            type: String,
            default: null,
        },
        label: {
            type: String,
            default: null,
        },
    },

    mounted() {
        console.log("type是：", this.type)
    },
}
</script>
<style scoped>
/* .cesium-button {
    border-radius: 5px;
    height: 32px;
    width: 32px;
    margin-left: 6px;
    margin-top: 6px;
    border: 1px solid #303336;
    background: url("@/images/icons/sat/2.svg") no-repeat;
    background-size: cover;
    z-index: 999;
    cursor: pointer;
    filter: brightness(3.1);
    transform: rotate(-90deg);
} */

.satellite {
    background: url("@/images/icons/sat/2.svg") no-repeat;
}

.ground {
    background: url("@/images/icons/sat/9.svg") no-repeat;
}

.link {
    background: url("@/images/icons/sat/5.svg") no-repeat;
}

.svg-sat {
    filter: brightness(3.1);
    margin-bottom: 2px;
}

.icon {
    display: inherit;
    vertical-align: middle;
    width: 22px;
    height: 22px;
}
</style>