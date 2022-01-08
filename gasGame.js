//import { DragPlugin } from "phaser3-rex-plugins/plugins/drag-plugin.js";

var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
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
    var line = null;
    var start_point = null;

    var is_pointerdown = false;

    //物理計算関係
    this.matter.world.setBounds(1).disableGravity();

    splite = this.add.image(750,100,'saisei').setInteractive();
    splite.setScale(0.2);

    splite.on('pointerdown',function (pointer) {

        createStaticPolygon(scene,points,lines);

        for (let i = 0; i < 16; i++) {
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
            gasballs.push(new_ball);
        }
        
    });

    //init pointer
    var graphics = scene.add.graphics();

    //gabana point
    var point = addFulcrumPoint(graphics,630,180);
    points.push(point);
    //home point
    point = addFulcrumPoint(graphics,200,180);
    points.push(point);

    field.on('pointerdown',function (pointer,dragX,dragY) {
        console.log('dragstart++');
        is_pointerdown = true;
        graphics = scene.add.graphics();
        graphics.depth = 1;
        //lines.push(graphics);

        line = new Phaser.Geom.Line();
        line.setTo(pointer.x,pointer.y,pointer.x,pointer.y);
        for (const point of points) {
            if(checkPointer(point,pointer)){
                line.setTo(point.x,point.y,point.x,point.y);
                start_point = point;
                break;
            }
        }
        lines.push(line);

        graphics.clear();
        graphics.lineStyle(pipe_width,0xd3d3d3);
        graphics.strokeLineShape(line);
    });

    field.on('pointermove',function (pointer,dragX,dragY) {
        if (is_pointerdown) {
            console.log('move');
            line.x2 = pointer.x;
            line.y2 = pointer.y;

            graphics.clear();
            graphics.lineStyle(pipe_width,0xd3d3d3);
            graphics.strokeLineShape(line);
        }
    });

    field.on('pointerup',function (pointer,dragX,dragY) {
        is_pointerdown = false;

        //スタート点の修正
        if (start_point == null) {
            start_point = addFulcrumPoint(graphics,line.x1,line.y1);
            points.push(start_point);
        }

        start_point.inLineRads.push(Phaser.Geom.Line.Angle(line)+3.14);
        start_point.connect_Line.push(line);
        start_point = null;

        //離した点の修正
        for (const point of points) {
            if(checkPointer(point,pointer)){
                line.x2 = point.x;
                line.y2 = point.y;

                graphics.clear();
                graphics.lineStyle(pipe_width,0xd3d3d3);
                graphics.strokeLineShape(line);

                point.inLineRads.push(Phaser.Geom.Line.Angle(line));
                point.connect_Line.push(line);

                //createPipeEdges(scene,line);
                
                return;
            }
        }

        var point = addFulcrumPoint(graphics,pointer.x,pointer.y);
        points.push(point);
        //pointに入射角も入れる
        point.inLineRads.push(Phaser.Geom.Line.Angle(line));
        point.connect_Line.push(line);

    });
}
function addFulcrumPoint(graphics,x,y) {
    let point = new Phaser.Geom.Circle(x,y,20);

    graphics.fillStyle(0xFF0000,0.5);
    graphics.fillCircleShape(point);
    graphics.depth = 2;

    point.inLineRads = [];
    point.connect_Line = [];

    return point
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
                continue;
            }
            let [x,y] = result;

            let left = temp_line.x1 > temp_line.x2 ? temp_line.x1 : temp_line.x2;
            let right = left == temp_line.x1 ? temp_line.x2 : temp_line.x1;
            if (left > x && x > right) {
                let replace_number = Math.abs(temp_line.x1 - x) > Math.abs(temp_line.x2 - x) ? '2' : '1';
                temp_line['x'+replace_number] = x;
                temp_line['y'+replace_number] = y;
            }
            left = line.x1 > line.x2 ? line.x1 : line.x2;
            right = left == line.x1 ? line.x2 : line.x1;
            if (left > x && x > right) {
                replace_number = Math.abs(line.x1 - x) > Math.abs(line.x2 - x) ? '2' : '1';
                line['x'+replace_number] = x;
                line['y'+replace_number] = y;
            }
        }
        temp_line = edge_Lines.shift();
    }

    
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
        circle_points.push({x:x,y:y});
    }
    return circle_points;
}

//create poligon figured line
function makeLinePolygon(line,width,height) {
    let polygon = [];
    polygon.push({x:line.x1+width,y:line.y1-height});
    polygon.push({x:line.x1-width,y:line.y1+height});
    polygon.push({x:line.x2-width,y:line.y2+height});
    polygon.push({x:line.x2+width,y:line.y2-height});
    return polygon;
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

function createPipeEdges(scene,line) {
    // //create pipe edges from 

    //dynamic polygon create right
    var figure = makeLinePolygon(line.rightEdge,line.edge_polygon_coll.x,line.edge_polygon_coll.y);
    let x = ((line.x1+line.x2)/2)+line.edge_center_diff.x;
    let y = ((line.y1+line.y2)/2)-line.edge_center_diff.y;
    var polygon = scene.add.polygon(x,y,figure,0x0000ff,0.2);
    polygon.setDepth(3);
    
    //polygon.setDisplayOrigin(0,0);
    test_polygon = polygon;
    scene.matter.add.gameObject(polygon, { isStatic:true ,shape: { type: 'fromVerts', verts: figure, flagInternal: true } });


    //dynamic polygon create left
    figure = makeLinePolygon(line.leftEdge,-line.edge_polygon_coll.x,-line.edge_polygon_coll.y);
    x = ((line.x1+line.x2)/2)-line.edge_center_diff.x;
    y = ((line.y1+line.y2)/2)+line.edge_center_diff.y;
    polygon = scene.add.polygon(x,y,figure,0x0000ff,0.2);
    polygon.setDepth(3);
    //polygon.setDisplayOrigin(0,0);
    test_polygon = polygon;
    scene.matter.add.gameObject(polygon, { isStatic:true ,shape: { type: 'fromVerts', verts: figure, flagInternal: true } });
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
