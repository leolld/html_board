 /* jshint esversion: 6 */
class H5Board{
    constructor(rootdiv, sitemap_data, locus_data, pmg_data){
        
        this.rootdiv = rootdiv;
        this.rootdiv.style.overflow="scroll";
        this.rootdiv.style.position = "relative";
        //this.rootdiv.style.zIndex = "-1";
        this.cv = document.createElement('canvas');
        this.c = this.cv.getContext("2d");
        //this.c.globalCompositeOperation="source-over";
        this.rootdiv.appendChild(this.cv);
        this.mousePos = {x:0, y:0};
        this.b_ctrl_keydown = false;
        this.cv.addEventListener('mousemove',(e)=>{return this.mouseMove(e);});
        this.cv.addEventListener('click',(e)=>{return this.doClick(e);});
        this.cv.addEventListener('keydown', this.keydown); 
        window.addEventListener('keydown', this.keydown); 
        this.cv.addEventListener('keyup', this.keyup); 
        window.addEventListener('keyup', this.keyup); 
        this.normal_car_img=this.create_car_image(0);
        this.warning_car_img=this.create_car_image(1);
        this.highlight_car_img=this.create_car_image(2);
        this.warninghighlight_car_img=this.create_car_image(3);
        this.car_imgs = [this.normal_car_img, this.warning_car_img, this.highlight_car_img, this.warninghighlight_car_img];
        this.temp_car_img = document.createElement('canvas');
        this.temp_car_img.width = 60;
        this.temp_car_img.height = 60;
        this.imgX=0;
        this.imgY=0;
        this.imgScale=1;
        this.imgScale_last=1;
        this.minScale=0.1;
        this.maxScale=8;
        this.scale=2;
        this.bgImg = document.createElement('canvas');
        this.grid_Pattern = document.createElement('canvas');
        this.map_image = null;
        this.mapDtaResp = null;
        this.locusdata = null;
        this.resolution = 0.05;
        this.onMouseMove = undefined;
        this.onClick = undefined;
        //绘制禁行区域内部变量
        this.draw_prohibitionareas = true;
        //绘制站点内部变量
        this.draw_station = true;
        //绘制线路内部变量
        this.draw_path= true;
        //绘制轨迹内部变量
        this.draw_locus= true;
        //绘制实时轨迹内部变量
        this.draw_runtimelocus= true;
        //绘制车辆
        this.draw_car= true;
        this.objmap = {};
//         this.objmap=JSON.parse('{"100":{"x":200,"y":200,"nx":0,"ny":0,"state":0,"amrorientation":0},"101":{"x":220,"y":400,"nx":0,"ny":0,"state":1,"amrorientation":0},"102":{"x":400,"y":600,"nx":0,"ny":0,"state":2,"amrorientation":0}\
// ,"103":{"x":170,"y":500,"nx":0,"ny":0,"state":3,"amrorientation":0},"104":{"x":600,"y":600,"nx":0,"ny":0,"state":0,"amrorientation":0}}');

        this.cv.onmousewheel=this.cv.onwheel=function(e){
            if(!this.b_ctrl_keydown || !this.bgImg) return;
            e.wheelDelta=e.wheelDelta?e.wheelDelta:(e.deltaY*(-40));
            
            if(e.wheelDelta>0&&this.imgScale<this.maxScale){//放大				
                this.imgScale*=this.scale;
                let destWidth=this.bgImg.width * this.imgScale + 20;
                let destHeight=this.bgImg.height * this.imgScale + 20;
                this.cv.width= destWidth;
                this.cv.height= destHeight;
                //this.c.clearRect(0, 0, this.cv.width, this.cv.height);
                //this.c.scale(this.imgScale, this.imgScale);
                // imgX=imgX*2-mousePos.x;
                // imgY=imgY*2-mousePos.y;
                this.drawAllComponent(0, 0, 0);
            }
            
            if(e.wheelDelta<0&&this.imgScale>this.minScale){//缩小				
                this.imgScale*=(1/this.scale);
                let destWidth=this.bgImg.width * this.imgScale + 20;
                let destHeight=this.bgImg.height * this.imgScale + 20;
                this.cv.width= destWidth;
                this.cv.height= destHeight;
                //this.c.clearRect(0, 0, cv.width, cv.height);
                //this.c.scale(imgScale, imgScale);
                // imgX=imgX*0.5+mousePos.x*0.5;
                // imgY=imgY*0.5+mousePos.y*0.5;
                this.drawAllComponent(0, 0, 0);
            }
        };
        this.display(sitemap_data, locus_data, pmg_data);
    }
   


    get_car(id){
        return this.objmap[id];
    }
    rotate_car_pos(amrorientation){
        //x0 中心点
        //x2 = (x1 - x0) * cosa - (y1 - y0) * sina + x0
        //y2 = (y1 - y0) * cosa + (x1 - x0) * sina + y0
        let x0 = -13;
        let y0 = -20;
        let x1 = 12;
        let y1 = -20;
        let x2 = 12;
        let y2 = 20;
        let x3 = -13;
        let y3 = 20;
        let ret = {};
        let angle = amrorientation * Math.PI/180;
        ret.x0 = x0 * Math.cos(angle) - y0 * Math.sin(angle);
        ret.y0 = y0 * Math.cos(angle) - x0 * Math.sin(angle);
        ret.x1 = x1 * Math.cos(angle) - y1 * Math.sin(angle);
        ret.y1 = y1 * Math.cos(angle) - x1 * Math.sin(angle);
        ret.x2 = x2 * Math.cos(angle) - y2 * Math.sin(angle);
        ret.y2 = y2 * Math.cos(angle) - x2 * Math.sin(angle);
        ret.x3 = x3 * Math.cos(angle) - y3 * Math.sin(angle);
        ret.y3 = y3 * Math.cos(angle) - x3 * Math.sin(angle);
        return ret;
    }

    put_car(id, x, y, state, amrorientation){
        let car =this.objmap[id];
        
        if(car){
            car.x = x;
            car.y = y;
            car.state = state;
            car.amrorientation = amrorientation;
            let ret = this.rotate_car_pos(amrorientation);
            car.x0 = ret.x0 + x;
            car.y0 = ret.y0 + y;
            car.x1 = ret.x1 + x;
            car.y1 = ret.y1 + y;
            car.x2 = ret.x2 + x;
            car.y2 = ret.y2 + y;
            car.x3 = ret.x3 + x;
            car.y3 = ret.y3 + y;
        }else{
            car = {};
            car.id = id;
            car.x = x;
            car.y = y;
            car.state = state;
            car.amrorientation = amrorientation;
            car.nx = x;
            car.ny = y;
            let ret = this.rotate_car_pos(amrorientation);
            car.x0 = ret.x0 + x;
            car.y0 = ret.y0 + y;
            car.x1 = ret.x1 + x;
            car.y1 = ret.y1 + y;
            car.x2 = ret.x2 + x;
            car.y2 = ret.y2 + y;
            car.x3 = ret.x3 + x;
            car.y3 = ret.y3 + y;
            car.selected = false;
            this.objmap[id] = car;
        }
        
    }
    //绘制禁行区域
    set_draw_prohibitionareas(enable){
        if(this.draw_prohibitionareas!==enable){
            this.draw_prohibitionareas = enable;
            this.redraw_bg();
            this.drawAllComponent(0, 0, 0);
        }
    }
    //绘制站点
    set_draw_station(enable){
        if(this.draw_station!==enable){
            this.draw_station = enable;
            this.redraw_bg();
            this.drawAllComponent(0, 0, 0);
        }
    }
    //绘制线路
    set_draw_path(enable){
        if(this.draw_path!==enable){
            this.draw_path = enable;
            this.redraw_bg();
            this.drawAllComponent(0, 0, 0);
        }
    }
    //绘制轨迹
    set_draw_locus(enable){
        if(this.draw_locus!==enable){
            this.draw_locus = enable;
            this.redraw_bg();
            this.drawAllComponent(0, 0, 0);
        }
    }
    //绘制实时轨迹
    set_draw_runtimelocus(enable){
        if(this.draw_runtimelocus!==enable){
            this.draw_runtimelocus = enable;
            this.redraw_bg();
            this.drawAllComponent(0, 0, 0);
        }
    }
    //绘制车辆
    set_draw_car(enable){
        if(this.draw_car!==enable){
            this.draw_car = enable;
            this.redraw_bg();
            this.drawAllComponent(0, 0, 0);
        }
    }
    keydown(ev) 
    { 
        if(!this.bgImg) return;
        let Ev= ev || window.event; 
        if(Ev.ctrlKey && Ev.key=='Control'){ this.b_ctrl_keydown = true;}
        Ev.preventDefault();
    } 
    keyup(ev) 
    { 
        if(!this.bgImg) return;
        let Ev= ev || window.event; 
        if(Ev.key=='Control'){ this.b_ctrl_keydown = false;}
        Ev.preventDefault();
    }
    zoomIn(){
        if(!this.bgImg) return;
        if(this.imgScale<this.maxScale){//放大				
            this.imgScale*=this.scale;
            // imgX=imgX*2-mousePos.x;
            // imgY=imgY*2-mousePos.y;
            let top = this.cv.scrollTop;
            top *=2;
            let left = this.cv.scrollLeft;
            left *=2;
            let destWidth=this.bgImg.width * this.imgScale + 20;
            let destHeight=this.bgImg.height * this.imgScale + 20;
            this.cv.width= destWidth;
            this.cv.height= destHeight;
            this.cv.scrollTop = top;
            this.cv.scrollLeft = left;
            this.drawAllComponent(0, 0, 0);
        }
    }
    zoomOut(){
        if(!this.bgImg) return;
        if(this.imgScale>this.minScale){//缩小				
            this.imgScale*=(1/this.scale);
            // imgX=imgX*0.5+mousePos.x*0.5;
            // imgY=imgY*0.5+mousePos.y*0.5;
            let top = this.cv.scrollTop;
            top *=0.5;
            let left = this.cv.scrollLeft;
            left *=0.5;
            let destWidth=this.bgImg.width * this.imgScale + 20;
            let destHeight=this.bgImg.height * this.imgScale + 20;
            this.cv.width= destWidth;
            this.cv.height= destHeight;
            this.cv.scrollTop = top;
            this.cv.scrollLeft = left;
            this.drawAllComponent(0, 0, 0);
        }
    }       
    
    drawAllComponent(mapRotate, map_trans_x, map_trans_y) {
        if(!this.bgImg) return;
        //清空面板
        //c.clearRect(0, 0, c.width, c.height);
        //重绘背景图	
        //destWidth=cv.width*imgScale;
        //destHeight=cv.height*imgScale;
        this.c.clearRect(0, 0, this.cv.width, this.cv.height);
        //c.translate(0, -cv.height);
        
        if(mapRotate!=0){
            this.c.rotate(mapRotate);
        }
        if(map_trans_x || map_trans_y){
            this.c.translate(map_trans_x, map_trans_y);
        }
        let has_scale = false;
        if(this.imgScale_last != this.imgScale){
            has_scale = true;
            this.imgScale_last = this.imgScale;
        }
        if(has_scale){
            this.c.setTransform(1, 0, 0, 1, 0, 0);
            this.c.scale(this.imgScale, this.imgScale);
        }
        
        //c.translate(0, cv.height);
        this.c.drawImage(this.bgImg, 0, 0);
        // this.c.scale(1, 1);
        
        //c.fillStyle = 'red';
        if(this.draw_car || this.draw_runtimelocus)
        for(var objid in this.objmap){
          

            //c.beginPath();
            if(this.draw_runtimelocus && (this.objmap[objid].nx != this.objmap[objid].x || this.objmap[objid].ny != this.objmap[objid].y)){
                this.c.setLineDash([]);
                this.c.moveTo(this.objmap[objid].nx, this.objmap[objid].ny );
                this.c.lineTo(this.objmap[objid].x, this.objmap[objid].y );
                this.c.lineWidth = 1;
                this.c.strokeStyle = 'green';
                this.c.stroke();
                this.objmap[objid].nx = this.objmap[objid].x;
                this.objmap[objid].ny = this.objmap[objid].y;

            }

            if(this.draw_car){
                let x = this.objmap[objid].x - 30;
                let y = this.objmap[objid].y - 30;
                //c.fillRect(x, y, 15, 10);
                //car_imgs_c = car_imgs[objmap[objid]["state"]].getContext('2d')
                this.temp_car_img.getContext('2d').save();
                //temp_car_img.translate(x, y);
                //temp_car_img.getContext('2d').rotate(0)
                this.temp_car_img.getContext('2d').clearRect(0, 0, 60, 60);
                //temp_car_img.getContext('2d').strokeStyle = "red"
                //temp_car_img.getContext('2d').strokeRect(0, 0, 60, 60);
                this.temp_car_img.getContext('2d').translate(30, 30);
                this.temp_car_img.getContext('2d').rotate(this.objmap[objid].amrorientation);
                //temp_car_img.getContext('2d').translate(-40-13, -20);
                this.temp_car_img.getContext('2d').drawImage(this.car_imgs[this.objmap[objid].state + (this.objmap[objid].selected?2:0)], -13, -20);
                this.c.drawImage(this.temp_car_img, x, y);
                this.temp_car_img.getContext('2d').restore();
                //c.closePath();
                //c.fill();
                this.objmap[objid].nx = this.objmap[objid].x;
                this.objmap[objid].ny = this.objmap[objid].y;
            }
            
        }
        
        // c.fillRect(200, 200, 15, 10);
        
        // c.scale(1 / scale, 1 / scale);
        // c.translate(cv.width / 2, cv.height / 2);
        // c.rotate(-0.17, -0.17);
        // c.translate(-(cv.width / 2), -(cv.height / 2));

        //c.drawImage(bgImg, 0, 0, bgImg.width, bgImg.height, imgX, imgY, destWidth, destHeight);
        //c.putImageData(bgImg,0,0);
    }
    // randomrun(){
       
    //     for(var objid in this.objmap){
    //         let randx = (5 - Math.floor((Math.random()*10)+1)) * 3;
    //         let randy = (5 - Math.floor((Math.random()*10)+1)) * 3;
    //         this.objmap[objid].nx = this.objmap[objid].x - randx;
    //         this.objmap[objid].ny = this.objmap[objid].y- randy;
    //         if (this.objmap[objid].nx > this.cv.width || this.objmap[objid].nx < 0){
    //             this.objmap[objid].nx = 200;
    //         }
    //         if (this.objmap[objid].ny > this.cv.height || this.objmap[objid].ny < 0){
    //             this.objmap[objid].ny = 200;
    //         }
    //         this.objmap[objid].state = Math.floor((Math.random()*4));
    //         this.objmap[objid].amrorientation = Math.random() * (Math.PI * 2);
    //     }
    //     this.drawAllComponent();
    // }
    roundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x, y + radius);
        ctx.arcTo(x, y + height, x + radius, y + height, radius);
        ctx.arcTo(x + width, y + height, x + width, y + height - radius, radius);
        ctx.arcTo(x + width, y, x + width - radius, y, radius);
        ctx.arcTo(x, y, x, y + radius, radius);
        ctx.stroke();
    }
    // mouseCoords(ev){ 
    //             if(ev.pageX || ev.pageY){ 
    //                 return {x:ev.pageX, y:ev.pageY}; 
    //             } 
    //             return{ 
    //                 x:ev.clientX + document.body.scrollLeft - document.body.clientLeft - rootdiv.left, 
    //                 y:ev.clientY + document.body.scrollTop - document.body.clientTop - rootdiv.top 
    //             }; 
    // }
    mouseMove(ev){ 
        let Ev= ev || window.event; 
        let x = Ev.offsetX;
        let y = Ev.offsetY;
        if(this.onMouseMove){
            this.onMouseMove(x, y);
        }
    }
    doClick(ev){ 
        let Ev= ev || window.event; 
        let x = Ev.offsetX/this.imgScale;
        let y = Ev.offsetY/this.imgScale;
        let car = this.hitTest(x, y);
        if(car){
            car.selected = !car.selected;
            this.refresh();
            if(car.selected && this.onClick){
                this.onClick(x, y);
            }
        }
        
    }
    hitTest(x, y){

        for(var objid in this.objmap){
            //顶线，在右边
            let car = this.objmap[objid];
            //Tmp = (y1 – y2) * x + (x2 – x1) * y + x1 * y2 – x2 * y1
            //Tmp > 0 在左侧 Tmp = 0 在线上 Tmp < 0 在右侧
            let tmp = (car.y0 - car.y1) * x + (car.x1 - car.x0) * y + car.x0 * car.y1 - car.x1 * car.y0;
            if(tmp >=0){
                tmp = (car.y1 - car.y2) * x + (car.x2 - car.x1) * y + car.x1 * car.y2 - car.x2 * car.y1;
                if(tmp >=0 ){
                    tmp = (car.y2 - car.y3) * x + (car.x3 - car.x2) * y + car.x2 * car.y3 - car.x3 * car.y2;
                    if(tmp >=0){
                        tmp = (car.y3 - car.y0) * x + (car.x0 - car.x3) * y + car.x3 * car.y0 - car.x0 * car.y3;
                        if(tmp >=0 ){
                            return car;
                        }
                    }
                }

            }
        }
        return null;
    }
    create_car_image(state){
        let car_canvas = document.createElement('canvas');
        car_canvas.width = 25;
        car_canvas.height = 40;
        let car_canvas_ctx = car_canvas.getContext('2d');
        car_canvas_ctx.setLineDash([]);
        car_canvas_ctx.strokeStyle = 'black';
        car_canvas_ctx.lineCap = 'square';
        car_canvas_ctx.lineJoin = 'miter';
        car_canvas_ctx.lineWidth = 1;
        this.roundedRect(car_canvas_ctx, 3, 0, 20, 40, 5);
        if (state == 2 || state == 3){
            car_canvas_ctx.fillStyle = 'rgb(0, 255, 255)';
        }else{
            car_canvas_ctx.fillStyle = 'blue';
        }
        
        car_canvas_ctx.fill();
        car_canvas_ctx.moveTo(13, 0);
        car_canvas_ctx.lineTo(13, 7);
        car_canvas_ctx.stroke();
        car_canvas_ctx.fillStyle = 'rgb(255,255,255)';
        this.roundedRect(car_canvas_ctx, 1, 15, 5, 10, 2);
        car_canvas_ctx.fill();
        this.roundedRect(car_canvas_ctx, 20, 15, 5, 10, 2);
        car_canvas_ctx.fill();
        if (state == 1 || state == 3){
            car_canvas_ctx.strokeStyle = 'red';
            this.roundedRect(car_canvas_ctx, 7, 27, 13, 6, 1);
            car_canvas_ctx.fillStyle = 'red';
            car_canvas_ctx.fill();
        }
        // if (state == 2 || state == 3){
        //     car_canvas_ctx.strokeStyle = 'black';
        //     this.roundedRect(car_canvas_ctx, 8, 8, 10, 10, 1);
        //     car_canvas_ctx.fillStyle = 'rgb(0, 255, 255)';
        //     car_canvas_ctx.fill();
        // }
        return car_canvas;
    }

    redraw_bg(){
        let ctx = this.bgImg.getContext('2d');
        ctx.clearRect(0, 0, this.bgImg.width, this.bgImg.height);
        ctx.drawImage(this.map_image, 0, 0);
        //绘制禁行
        if(this.draw_prohibitionareas){
            ctx.beginPath();
            ctx.strokeStyle = 'black';
            //let gp = ctx.createPattern(this.grid_Pattern, "repeat");
            //ctx.fillStyle = gp;
            ctx.fillStyle = 'black';
            this.mapDtaResp.data.prohibitionareas.prohibition_areas.forEach(element=>{
                ctx.moveTo(Math.round(element[0][0]), Math.round(element[0][1]));
                for (let index = 1; index < element.length; index++) {
                    const nextpoint = element[index];
                    ctx.lineTo(Math.round(nextpoint[0]), Math.round(nextpoint[1]));
                }
                if(element.length > 3){
                    ctx.lineTo(Math.round(element[0][0]), Math.round(element[0][1]));
                }
            });
            ctx.stroke();
            //ctx.strokeRect(10, 10, 500, 50);
            //ctx.fillRect(10, 10, 500, 50);
            ctx.fill();
        }

        //绘制stations
        if(this.draw_station)
        this.mapDtaResp.data.stations.forEach(element => {
            let orientation = element.pose.pose.position.orientation;
            let x = Math.round(element.pose.pose.position.x);
            let y = Math.round(element.pose.pose.position.y);
            let s_name = element.name;
            let s_description = element.description;
            let temp_car_ctx = this.temp_car_img.getContext('2d');
            temp_car_ctx.save();
            temp_car_ctx.clearRect(0, 0, 60, 60);
            // temp_car_ctx.strokeStyle = "red"
            // temp_car_ctx.strokeRect(0, 0, 60, 60);
            temp_car_ctx.translate(30, 30);
            temp_car_ctx.rotate(orientation);
            temp_car_ctx.setLineDash([]);
            temp_car_ctx.strokeStyle = 'red';
            temp_car_ctx.lineCap = 'square';
            temp_car_ctx.lineJoin = 'miter';
            temp_car_ctx.lineWidth = 1;
            temp_car_ctx.fillStyle = 'red';
            let w = 0.8 / this.resolution;
            let h = 0.6 / this.resolution;
            this.roundedRect(temp_car_ctx, -w/2, -h/2, w, h, 0);
            temp_car_ctx.fill();
            temp_car_ctx.fillStyle = 'red';
            temp_car_ctx.font = '12px Georgia';
            temp_car_ctx.fillText(s_name, -w/2, -h/2 - 2);
            // temp_car_ctx.moveTo(-w/2 - 5, 0);
            // temp_car_ctx.lineTo(w/2 + 5, 0);
            var a1=new window.mapleque.arrow();
            a1.set({x: -w/2 - 5,y: 0}, {x: w/2 + 10,y: 0});
            a1.setPara({
                arrow_size:0.2,
                arrow_sharp:0.1
               });
            a1.paint(temp_car_ctx);
            ctx.drawImage(this.temp_car_img, x-30, y-30);
            temp_car_ctx.restore();
        });

        //绘制path
        if(this.draw_path){
            ctx.beginPath();
            ctx.setLineDash([]);
            ctx.strokeStyle = 'green';
            ctx.lineCap = 'square';
            ctx.lineJoin = 'miter';
            ctx.lineWidth = 2;
            ctx.fillStyle = null;
            this.mapDtaResp.data.paths.forEach(element => {
                let p_name = element.name;
                let p_description = element.description;
                let pose = element.path.poses[0];
                let orientation = pose.pose.position.orientation;
                let x = Math.round(pose.pose.position.x);
                let y = Math.round(pose.pose.position.y);
                ctx.moveTo(x, y);
                for (let index = 1; index < element.path.poses.length; index++) {
                    const nextpose = element.path.poses[index];
                    orientation = nextpose.pose.position.orientation;
                    x = Math.round(nextpose.pose.position.x);
                    y = Math.round(nextpose.pose.position.y);
                    ctx.lineTo(x, y);
                }                    
            });
            ctx.stroke();
        }

        //绘制规划路径
        if(this.draw_locus){
            ctx.beginPath();
            ctx.setLineDash([]);
            ctx.strokeStyle = 'red';
            ctx.lineCap = 'square';
            ctx.lineJoin = 'miter';
            ctx.lineWidth = 2;
            ctx.fillStyle = 'red';
            if(this.locusdata.data.planroute.length > 1 ){
                let x = Math.round(this.locusdata.data.planroute[0].amrpositionx);
                let y = Math.round(this.locusdata.data.planroute[0].amrpositiony);
                ctx.moveTo(x, y);
                for (let index = 1; index < this.locusdata.data.planroute.length; index++) {
                    // const nextpose = element.path.poses[index];
                    // orientation = nextpose.pose.position.orientation;
                    x = Math.round(this.locusdata.data.planroute[index].amrpositionx);
                    y = Math.round(this.locusdata.data.planroute[index].amrpositiony);
                    ctx.lineTo(x, y);
                }    
            }
            ctx.stroke();
        }

        //绘制实际路径
        if(this.draw_runtimelocus){
            
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.strokeStyle = 'green';
            ctx.lineCap = 'square';
            ctx.lineJoin = 'miter';
            ctx.lineWidth = 2;
            ctx.fillStyle = null;
            if(this.locusdata.data.actualroute.length > 1 ){
                let x = Math.round(this.locusdata.data.actualroute[0].amrpositionx);
                let y = Math.round(this.locusdata.data.actualroute[0].amrpositiony);
                ctx.moveTo(x, y);
                for (let index = 1; index < this.locusdata.data.actualroute.length; index++) {
                    // const nextpose = element.path.poses[index];
                    // orientation = nextpose.pose.position.orientation;
                    x = Math.round(this.locusdata.data.actualroute[index].amrpositionx);
                    y = Math.round(this.locusdata.data.actualroute[index].amrpositiony);
                    ctx.lineTo(x, y);
                }    
            }
            ctx.stroke();
        }
    }

    display(data, locusdata, pmg_data){
        this.mapDtaResp = data;
        this.locusdata = locusdata;
        //alert(mapDtaResp.data.mapdata.length)
        //alert(atob(mapDtaResp.data.mapdata))
        ///alert(mapDtaResp.data.paths)
        //alert(mapDtaResp.data.prohibitionareas.prohibition_areas[0][0])
        let image = new MapImage(pmg_data?pmg_data:atob(this.mapDtaResp.data.mapdata));
        this.map_image = image.getInitMap('canvas');
        this.bgImg.width = this.map_image.width;
        this.bgImg.height = this.map_image.height;
        //console.log(this.mapDtaResp.data.resolution);
        if (this.mapDtaResp.data.resolution)
        this.resolution = this.mapDtaResp.data.resolution;

        
        this.grid_Pattern.width = 10;
        this.grid_Pattern.height = 10;
        let grid_Pattern_ctx = this.grid_Pattern.getContext('2d');
        //grid_Pattern_ctx.width = 10;
        //grid_Pattern_ctx.height = 10;
        ///grid_Pattern_ctx.clearRect(0, 0, 10, 10);
        //grid_Pattern_ctx.fillStyle = 'red';
        //grid_Pattern_ctx.fillRect(0, 0, 10, 10);
        grid_Pattern_ctx.setLineDash([]);
        grid_Pattern_ctx.strokeStyle = 'black';
        grid_Pattern_ctx.lineCap = 'square';
        grid_Pattern_ctx.lineJoin = 'miter';
        // grid_Pattern_ctx.shadowOffsetX = 0;
        // grid_Pattern_ctx.shadowOffsetY = 0;
        // grid_Pattern_ctx.shadowBlur = 0;
        //grid_Pattern_ctx.shadowColor
        grid_Pattern_ctx.lineWidth = 1;
        grid_Pattern_ctx.moveTo(0, 0);
        grid_Pattern_ctx.lineTo(10, 10);
        grid_Pattern_ctx.moveTo(10, 0);
        grid_Pattern_ctx.lineTo(0, 10);
        grid_Pattern_ctx.stroke();
        

    
        this.redraw_bg();

        this.cv.width =this.bgImg.width + 20;
        this.cv.height =this.bgImg.height + 20;
        //c.putImageData(bgImg,0,0);
        //c.drawImage(bgImg, 0, 0)
        //drawAllComponent(1, -0.17, 0, 200)
        this.drawAllComponent(0, 0, 0);
    }

    refresh() {
        this.drawAllComponent(0, 0, 0);
    }
}