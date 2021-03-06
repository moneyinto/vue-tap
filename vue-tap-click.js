/**
 * Created by 二哲 on 15/12/6.
 */
/*
* 不带参数指令
* v-tap=handler
* or
* 带参数指令
* v-tap=handler($index,el,$event)
*
* !!!新增!!!
* 把tapObj对象注册在原生event对象上
* event.tapObj拥有6个值
* pageX,pageY,clientX,clientY,distanceX,distanceY
* 后面2个分别的手指可能移动的位置(以后可用于拓展手势)
*
* */
;(function() {
    var vueTap = {};
    vueTap.install = function(Vue) {
        Vue.directive('tap', {
            isFn : true,
            acceptStatement : true,
            bind : function() {
                 //bind callback
            },
            update : function(fn) {
                var self = this;
                    self.tapObj = {};

                if(typeof fn !== 'function') {
                    return console.error('The param of directive "v-tap" must be a function!');
                }
                self.handler = function(e, isLong) { //This directive.handler
                    e.tapObj = self.tapObj;
                    // 用全局变量记录是否长按 -start
                    if (isLong) {
                        e.isLong = true
                    }
                    // 用全局变量记录是否长按 -end
                    fn.call(self,e);
                };
                if(self.isPC()) {
                    self.el.addEventListener('click',function(e) {
                        e.preventDefault();
                        fn.call(self,e);
                    },false);
                } else {
                    this.el.addEventListener('touchstart',function(e) {
                        // 增加self修饰符-start by COoL
                        if(self.modifiers.self && window.tapDone)
                            return;
                        window.tapDone = true;
                        setTimeout(function(){
                            window.tapDone = false;
                        },200);
                        // 增加self修饰符-end
                        
                        // 加入long修饰符实现长按动作-start by COoL
                        if (self.modifiers.long) {
                            window.longEnable = true;
                            window.longTimer = setTimeout(() => {
                                self.touchend(e,self,fn);
                            }, 600)
                        }
                        // 加入long修饰符实现长按动作-end

                        if(self.modifiers.stop)
                            e.stopPropagation();
                        if(self.modifiers.prevent)
                            e.preventDefault();
                        self.touchstart(e,self);
                    },false);
                    this.el.addEventListener('touchmove',function(e) {
                        //e.preventDefault();
                        window.longEnable = false;
                    },false);
                    this.el.addEventListener('touchend',function(e) {
                        //e.preventDefault();
                        self.touchend(e,self,fn);
                    },false);
                }
            },
            unbind : function() {},
            isTap : function() {
                var self   = this;
                if(self.el && self.el.disabled){
                    return 0; // 原为false
                }

                var tapObj = this.tapObj;
                if (Math.abs(tapObj.distanceX) >= 2 || Math.abs(tapObj.distanceY) >= 2) {
                    // 手指有移动，作废
                    return 0;
                } else if (this.time < 150) {
                    // 快速点击
                    return 1;
                } else if (this.time >= 600) {
                    // 长按
                    return 2;
                } else {
                    // 时间有误，作废
                    return 0;
                }
            },
            isPC : function() {
                var uaInfo = navigator.userAgent;
                var agents = ["Android", "iPhone", "Windows Phone", "iPad", "iPod"];
                var flag = true;
                for (var i = 0; i < agents.length; i++) {
                    if (uaInfo.indexOf(agents[i]) > 0) { flag = false; break; }
                }
                return flag;
            },
            touchstart : function(e,self) {
                var touches = e.touches[0];
                var tapObj = self.tapObj;
                tapObj.pageX = touches.pageX;
                tapObj.pageY = touches.pageY;
                tapObj.clientX = touches.clientX;
                tapObj.clientY = touches.clientY;
                self.time = +new Date();
            },
            touchend : function(e,self) {
                var touches = e.changedTouches[0];
                var tapObj = self.tapObj;
                self.time = +new Date() - self.time;
                tapObj.distanceX = tapObj.pageX - touches.pageX;
                tapObj.distanceY = tapObj.pageY - touches.pageY;

                // 加入long修饰符实现长按动作-start by COoL
                
                // 清除长按计时
                clearTimeout(window.longTimer)

                // 获取是否长按或无效
                var tapType = self.isTap(tapObj);
                if (tapType === 0) {
                    // 无效
                    return;
                }

                if (tapType === 1) {
                    // 短击
                    self.handler(e);
                    return;
                }

                if (self.modifiers.long && tapType === 2 && window.longEnable) {
                    // 允许长按且是长按且首次触发且未移动过
                    window.longEnable = false;
                    self.handler(e, true)
                    return;
                }
                // 加入long修饰符实现长按动作-end
                
                /*
                if (self.isTap(tapObj)){
                    self.handler(e);
                */
            }
        });
    };

    if (typeof exports == "object") {
        module.exports = vueTap;
    } else if (typeof define == "function" && define.amd) {
        define([], function(){ return vueTap })
    } else if (window.Vue) {
        window.vueTap = vueTap;
        Vue.use(vueTap);
    }

})();
