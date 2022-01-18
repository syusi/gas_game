//import { DragPlugin } from "phaser3-rex-plugins/plugins/drag-plugin.js";

var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 700,
    physics: {
        //arcade　軽い代わりに斜め直線判定等の機能が制限されている見たい？
        default: 'matter',
        arcade: {
            gravity: { y: 0 },
            debug:true
        },
        matter :{
            debug:true,
            setBounds: {
                left: true,
                right:true,
                top:true,
                bottom:true
            }
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update,
    }
};

var pipes = null; 
var game = new Phaser.Game(config);


function preload ()
{
    //plugin load
    //scene.load.plugin('rexdragplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexdragplugin.min.js', true);

    //assets load
    this.load.image('back','assets/backimage.jpeg');
    this.load.image('pipe','assets/pipe.png');
    this.load.image('curve_pipe','assets/pipe2_curve.png');
    this.load.image('gastank','assets/gas_tank.png');
    this.load.image('house','assets/building_house1.png');
    this.load.image('sora','assets/sora.png');
    this.load.image('saisei','assets/saisei.png');
    this.load.image('gasball','assets/gasball.png');
}

var platforms;
var logo;
var lines = [];
var points = [];
var gasballs = [];
var graphicses = [];
var money = 150;
var pipe_num = 3;

var test_polygon=  null;
const pipe_width = 40;
const curve_divide_unit = 15;

function create ()
{
    //init game field
    var scene = this;
    var splite = this.add.image(400,0,'sora');
    splite.setScale(2);
    var field = this.add.image(400, 375, 'back').setInteractive();
    splite = this.add.image(75,75,'house');
    splite.setScale(0.3);
    splite = this.add.image(750,75,'gastank');
    splite.setScale(0.3);
    splite = this.add.image(175,150,'curve_pipe');
    splite.setScale(0.2);
    splite.angle += 180;
    splite = this.add.image(650,150,'curve_pipe');
    splite.setScale(0.2);
    splite.angle += 90;
    var drowing_line = null;
    var start_point = null;

    var is_pointerdown = false;

    //init pointer
    var graphics = scene.add.graphics();

    //gabana point
    var point = addFulcrumPoint(graphics,630,180);
    points.push(point);
    //home point
    home_point = addFulcrumPoint(graphics,200,180);
    let home = this.matter.add.circle(200,180,15,{isStatic:true});
    home.goal = true;
    points.push(home_point);

    //物理計算関係
    this.matter.world.setBounds(1).disableGravity();

    splite = this.add.image(750,100,'saisei').setInteractive();
    splite.setScale(0.2);

    splite.on('pointerdown',function (pointer) {

        createStaticPolygon(scene,points,lines);

        for (let i = 0; i < 20; i++) {
            var new_ball = scene.matter.add.image(630,180,'gasball');
            new_ball.setDepth(5);
            //var new_ball = scene.matter.add.gameObject(ball_img);
            
            //matterは別のエンジンらしい。そっち見たほうが早い。多分完全な反射をするのは無理そう。
            //physicsだったころの名残
            //new_ball.setCollideWorldBounds(true);
            new_ball.setCircle(4);
            //摩擦
            new_ball.setFriction(0,0,0);
            new_ball.setBounce(1);
            scene.matter.body.setInertia(new_ball.body,Infinity);
            scene.matter.body.setMass(new_ball.body,0.000000000001);
            new_ball.setVelocity(Phaser.Math.Between(-3,3),Phaser.Math.Between(3,5));
            // pytsicsだったころの名残
            // for (const ball of gasballs) {
            //     scene.physics.add.collider(ball,new_ball);
            // }
            // scene.physics.add.collider(new_ball,zones);
            //scene.physics.add.collider(new_ball,testline);
            new_ball.setOnCollide(function (pair) {
                //collition on goal
                if (pair.bodyA.id == 5) {
                    pair.bodyB.gameObject.destroy();
                }
            });
            new_ball.body.frictionStatic = 0;
            gasballs.push(new_ball);
        }
        
    });
    

    field.on('pointerdown',function (pointer,dragX,dragY) {
        console.log('dragstart++');
        is_pointerdown = true;
        graphics = scene.add.graphics();
        graphics.depth = 1;
        //lines.push(graphics);

        drowing_line = new Phaser.Geom.Line();
        drowing_line.setTo(pointer.x,pointer.y,pointer.x,pointer.y);
        for (const point of points) {
            if(checkPointer(point,pointer)){
                drowing_line.setTo(point.x,point.y,point.x,point.y);
                start_point = point;
                break;
            }
        }
        lines.push(drowing_line);

        graphics.clear();
        graphics.lineStyle(pipe_width,0xd3d3d3);
        graphics.strokeLineShape(drowing_line);
    });

    field.on('pointermove',function (pointer,dragX,dragY) {
        if (is_pointerdown) {
            console.log('move');
            drowing_line.x2 = pointer.x;
            drowing_line.y2 = pointer.y;

            graphics.clear();
            graphics.lineStyle(pipe_width,0xd3d3d3);
            graphics.strokeLineShape(drowing_line);
        }
    });

    field.on('pointerup',function (pointer,dragX,dragY) {
        is_pointerdown = false;
    
        let isPoint_in = false;
        //離した点の修正
        for (const point of points) {
            if(checkPointer(point,pointer)){
                drowing_line.x2 = point.x;
                drowing_line.y2 = point.y; 

                point.inLineRads.push(Phaser.Geom.Line.Angle(drowing_line));
                point.connect_Line.push(drowing_line);

                isPoint_in = true;
                break;
            }
        }
        graphics.clear();
        graphics.lineStyle(pipe_width,0xd3d3d3);
        graphics.strokeLineShape(drowing_line);

        //createPipeEdges(scene,line);

        //スタート点の修正
        if (start_point == null) {
            start_point = addFulcrumPoint(graphics,drowing_line.x1,drowing_line.y1);
            points.push(start_point);
        }

        start_point.inLineRads.push(Phaser.Geom.Line.Angle(drowing_line)+3.14);
        start_point.connect_Line.push(drowing_line);
        start_point = null;

        //ゴール点の描画
        if (isPoint_in == false) {
            var point = addFulcrumPoint(graphics,drowing_line.x2,drowing_line.y2);
            points.push(point);
            //pointに入射角も入れる
            point.inLineRads.push(Phaser.Geom.Line.Angle(drowing_line));
            point.connect_Line.push(drowing_line);    
        }
    });
}

function addFulcrumPoint(graphics,x,y) {
    let point = new Phaser.Geom.Circle(x,y,20);

    graphics.fillStyle(0xFF0000,0.5);
    graphics.fillCircleShape(point);
    graphics.depth = 2;

    point.inLineRads = [];
    point.connect_Line = [];

    return point;
}

function createStaticPolygon(scene,points,lines){

    for (const line of lines) {
        calcPipeEdge(line);
    }

    for(var point of points){
        const angle_devide_dig = Array.from( { length: 360/curve_divide_unit}, (v,k) => k*curve_divide_unit);
        const angle_gap_index = Array.from({ length: 360/curve_divide_unit }, () => 0);

        for (const rad of point.inLineRads) {
            let angle_max = (rad+3.14/2)*180/3.14;
            let angle_min = (rad-3.14/2)*180/3.14;

            if( angle_max < 0 && angle_min < 0){
                angle_max += 360;
                angle_min += 360;
            }

            let wall_angles = [];
            if (angle_max > 360) {
                wall_angles.push({max:angle_max-360,min:0});
                angle_max = 360;
            }
            if(angle_min < 0){
                wall_angles.push({max:360,min:angle_min+360});
                angle_min = 0;
            }
            wall_angles.push({max:angle_max,min:angle_min});
            //0~360で壁がない部分を切り出す
            
            
            // 角度毎に切り出す
            for (const wall_angle of wall_angles) {
                const max_index = angle_devide_dig.map((v,k) => {return {v:Math.abs(v-wall_angle.max),k:k}}).sort((a,b)=> a.v-b.v)[0].k;
                let max_angle_fix = angle_devide_dig[max_index];
                const min_index = angle_devide_dig.map((v,k) => {return {v:Math.abs(v-wall_angle.min),k:k}}).sort((a,b)=> a.v-b.v)[0].k;
                let min_angle_fix = angle_devide_dig[min_index];
                
                for (let angle = min_angle_fix; angle <= max_angle_fix; angle+=curve_divide_unit) {
                    angle_gap_index[angle/curve_divide_unit]+=1;
                }
            }
            
        }

        let start_angle = undefined;
        for (const index in angle_gap_index) {
            
            if (start_angle == undefined && angle_gap_index[index] < 1) {
                start_angle = index*curve_divide_unit;
            }
            
            if(start_angle!=undefined && (angle_gap_index[index] > 0 || parseInt(index)+1 == angle_gap_index.length)){
                let end_angle = index*curve_divide_unit;
                createArcPoligon(scene,point,20,start_angle,end_angle);
                start_angle = undefined;
            }
        }

        pipeEdgeCut(point);
    }

    for(var line of lines){
        createPipeEdges(scene,line);
    }
}

//check pointer in circle
function checkPointer(circle,point) {
    //console.log(Phaser.Geom.Circle.ContainsPoint(circle,point));
    return Phaser.Geom.Circle.ContainsPoint(circle,point);
}

function pipeEdgeCut(point) {
    
    if (point.connect_Line.length < 2 ) {
        return;
    }

    let edge_Lines = [];

    for (const line of point.connect_Line) {
        edge_Lines.push(line.leftEdge);
        edge_Lines.push(line.rightEdge);
    }

    let temp_line = edge_Lines.shift();    
    while (edge_Lines.length != 0) {
        for (const line of edge_Lines) {
            let result = calcLineCross(temp_line,line);
            if(result == false){
                //horizonal of two line
                continue;
            }
            let [x,y] = result;

            let is_line_cross = false;
            let is_temp_cross = false;
            
            let left = temp_line.x1 > temp_line.x2 ? temp_line.x1 : temp_line.x2;
            let right = left == temp_line.x1 ? temp_line.x2 : temp_line.x1;
            if (left > x && x > right) {
                is_temp_cross = true;
            }

            left = line.x1 > line.x2 ? line.x1 : line.x2;
            right = left == line.x1 ? line.x2 : line.x1;
            if (left > x && x > right) {
                is_line_cross = true;
            }
            //is cross both of line
            if(is_line_cross && is_temp_cross){
                lineCutAndCorrection(temp_line,x,y);

                lineCutAndCorrection(line,x,y);
            }

            
        }
        temp_line = edge_Lines.shift();
    }

    
}

function lineCutAndCorrection(line,x,y){
    let replace_number = Math.abs(line.x1 - x) > Math.abs(line.x2 - x) ? '2' : '1';
    if(line.cutdiff != undefined){
        line.cutdiff.x += (x - line['x'+replace_number]);
        line.cutdiff.y += (y - line['y'+replace_number]);
    }else{
        line.cutdiff = {x:x - line['x'+replace_number],y:y - line['y'+replace_number]};
    }
    line['x'+replace_number] = x;
    line['y'+replace_number] = y;
}

//create Arc Poligon
function createArcPoligon(scene,point,radius,start_angle,end_angle){
    let circle_points = [];
    //角度
    const divide_rad = curve_divide_unit*3.14/180;
    start_angle -= curve_divide_unit;
    for(i=start_angle;i<=end_angle;i+=curve_divide_unit){
        let rad = i*3.14/180;
        let x = -radius * Math.cos(rad);
        let y = -radius * Math.sin(rad);
        let circle = scene.matter.add.circle(x+point.x,y+point.y,5,{isStatic:true});
        circle.frictionStatic = 0;
        circle_points.push({x:x,y:y});
    }
    return circle_points;
}

// calc x,y pos distance in line of center
function calcLineEdges(line_rad,width){
    //pi/2 = 90
    let residue_rad = (3.14/2)-line_rad;
    let x = width * Math.cos(residue_rad);
    let y = width * Math.sin(residue_rad);
    return {x:x,y:y};
}

function calcPipeEdge(line) {
    //caliculation of angle 
    //caution! ragian. angle = *180/3.14
    var rad = Phaser.Geom.Line.Angle(line);
    //中心からの距離を格納
    line.edge_center_diff = calcLineEdges(rad,pipe_width-20);
    
    // calc collision of line
    line.edge_polygon_coll = calcLineEdges(rad,5);

    line.rightEdge = {
        x1:line.x1+line.edge_center_diff.x,
        y1:line.y1-line.edge_center_diff.y,
        x2:line.x2+line.edge_center_diff.x,
        y2:line.y2-line.edge_center_diff.y,
    };

    line.leftEdge = {
        x1:line.x1-line.edge_center_diff.x,
        y1:line.y1+line.edge_center_diff.y,
        x2:line.x2-line.edge_center_diff.x,
        y2:line.y2+line.edge_center_diff.y,
    };
}

//create poligon figured line
function makeLinePolygon(line,width,height,corx,cory) {
    let polygon = [];
    polygon.push({x:line.x1+width-corx,y:line.y1-height-cory});
    polygon.push({x:line.x1-width-corx,y:line.y1+height-cory});
    polygon.push({x:line.x2-width-corx,y:line.y2+height-cory});
    polygon.push({x:line.x2+width-corx,y:line.y2-height-cory});
    return polygon;
}


function createPipeEdges(scene,line) {
    // //create pipe edges from 

    //dynamic polygon create right
    let x = ((line.x1+line.x2)/2)+line.edge_center_diff.x;
    let y = ((line.y1+line.y2)/2)-line.edge_center_diff.y;
    if (line.rightEdge.cutdiff != undefined) {
        x += line.rightEdge.cutdiff.x/2;
        y += line.rightEdge.cutdiff.y/2;
    }
    var figure = makeLinePolygon(line.rightEdge,line.edge_polygon_coll.x,line.edge_polygon_coll.y,x*0.9,y*0.5);//20 178
    var polygon = scene.add.polygon(x,y,figure);
    polygon.setDepth(3);
    
    //polygon.setDisplayOrigin(0,0);
    test_polygon = polygon;
    var obj = scene.matter.add.gameObject(polygon, { isStatic:true ,shape: { type: 'fromVerts', verts: figure, flagInternal: true } }).setOrigin(1,0.5);
    obj.setFriction(0);
    obj.body.frictionStatic = 0;

    //dynamic polygon create left
    figure = makeLinePolygon(line.leftEdge,-line.edge_polygon_coll.x,-line.edge_polygon_coll.y,0,0);
    x = ((line.x1+line.x2)/2)-line.edge_center_diff.x;
    y = ((line.y1+line.y2)/2)+line.edge_center_diff.y;
    if (line.leftEdge.cutdiff != undefined) {
        x += line.leftEdge.cutdiff.x/2;
        y += line.leftEdge.cutdiff.y/2;
    }
    //polygon = scene.add.polygon(x,y,figure,0x0000ff,0.2);
    polygon = scene.add.polygon(x,y,figure);
    polygon.setDepth(3);
    //polygon.setDisplayOrigin(0,0);
    test_polygon = polygon;
    obj = scene.matter.add.gameObject(polygon, { isStatic:true ,shape: { type: 'fromVerts', verts: figure, flagInternal: true } });
    obj.setFriction(0);
    obj.body.frictionStatic = 0;
}

function calcLineCross(line1,line2) {
    
    let [a1,b1] = calcExpressLine(line1);
    let [a2,b2] = calcExpressLine(line2);

    if(a1 == a2){
        return false;
    }

    let x = (b2 - b1)/(a1 - a2);
    let y = x * a1 + b1;

    return [x,y];
}
function calcExpressLine(line) {
    //y = ax+b
    let a = (line.y1 - line.y2)/(line.x1 - line.x2);
    let b = line.y1 - a*line.x1;

    return [a,b];
}

function update() {
    
    // var cursor = this.input.keyboard.createCursorKeys();

    // if (cursor.up.isDown) {
    //     logo.setVelocityY(-200)
    // }
    // if (line =! null) {
    //     graphics.strokeLineShape(line);
    // }


}
function render() {
    // game.debug.geom(line)
    // game.debug.lineinfo(line,32,32);

    // game.debug.text("Drag the handles",32,300);
}
