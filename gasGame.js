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
    // plugins:{
    //     global:[
    //         {
    //             key:'redDrag',
    //             plugin:DragPlugin,
    //             start:true
    //         }
    //     ]
    // },
    scene: {
        preload: preload,
        create: create,
        update: update,
        //render: render,
    }
};

var pipes = null; 
var game = new Phaser.Game(config);


function preload ()
{
    //plugin load
    //scene.load.plugin('rexdragplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexdragplugin.min.js', true);

    //assets load
    //this.load.setBaseURL('http://localhost:8080');
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
    var is_pointerdown = false;

    //物理計算関係
    this.matter.world.setBounds(1).disableGravity();

    splite = this.add.image(750,100,'saisei').setInteractive();
    splite.setScale(0.2);

    splite.on('pointerdown',function (pointer) {

        createStaticPolygon(scene,points,lines);

        for (let i = 0; i < 64; i++) {
            var new_ball = scene.matter.add.image(650,150,'gasball');
            //var new_ball = scene.matter.add.gameObject(ball_img);
            
            //matterは別のエンジンらしい。そっち見たほうが早い。多分完全な反射をするのは無理そう。
            //physicsだったころの名残
            //new_ball.setCollideWorldBounds(true);
            new_ball.setCircle(5);
            //摩擦
            new_ball.setFriction(0,0,0);
            new_ball.setBounce(1);
            scene.matter.body.setInertia(new_ball.body,Infinity);
            scene.matter.body.setMass(new_ball.body,0.000000000001);
            new_ball.setVelocity(Phaser.Math.Between(-5,5),Phaser.Math.Between(5,10));
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
    var point = new Phaser.Geom.Circle(630,180,20);
    point.inLineRads = [];
    points.push(point);
    graphics.fillStyle(0xFF0000,0.5);
    graphics.fillCircleShape(point);
    point = new Phaser.Geom.Circle(200,180,20);
    point.inLineRads = [];
    points.push(point);
    graphics.fillCircleShape(point);

    //test line
    //var testline = this.add.line(0,0,100,100,200,200,0xff0000);
    //testline.setDepth(2);

    //poligon test
    //どうやらfigureは文字列型にしないといけないらしい。
    //var figure = '400 200 200 278 340 430 550 80';
    //var polygon = this.add.polygon(400,300,figure,0x0000ff,0.2);
    // graphics.lineStyle(10,0x00aa00);
    // graphics.beginPath();
    // graphics.moveTo(polygon.points[0].x, polygon.points[0].y);
    // for (var i = 1; i < polygon.points.length; i++)
    // {
    //     graphics.lineTo(polygon.points[i].x, polygon.points[i].y);
    // }
    // graphics.closePath();
    // graphics.strokePath();

    //this.matter.add.gameObject(polygon, { shape: { type: 'fromVerts', verts: figure, flagInternal: true } });
    
    // var zones = this.physics.add.staticGroup();
    // zones.add(this.add.zone(400,300,200,5));
    // //原点の位置が当たり判定になる。
    // zones.add(testline);
    // // zones.add(graphics);
    // //zones.add(polygon);
    // // var path = this.add.path(200,100);
    // // path.lineTo(300,400);
    // // zones.add(this.add.curve(100,200,path,0xff0000));

    // pipepoints = [new Phaser.Math.Vector2(100,100),new Phaser.Math.Vector2(200,200)];
    // var rope = this.add.rope(0,0,'pipe',null,pipepoints);
    // zones.add(rope);

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
        for (const point of points) {
            if(checkPointer(point,pointer)){
                line.x2 = point.x;
                line.y2 = point.y;

                graphics.clear();
                graphics.lineStyle(pipe_width,0xd3d3d3);
                graphics.strokeLineShape(line);

                point.inLineRads.push(Phaser.Geom.Line.Angle(line));

                //createPipeEdges(scene,line);
                
                return;
            }
        }
        var point = new Phaser.Geom.Circle(pointer.x,pointer.y,20);
        //pointに入射角も入れる
        point.inLineRads = [];
        point.inLineRads.push(Phaser.Geom.Line.Angle(line));

        points.push(point);
        graphics.fillStyle(0xFF0000,0.5);
        graphics.fillCircleShape(point);

        //createPipeEdges(scene,line);

        //createArcPoligon(scene,{x:pointer.x,y:pointer.y},20,90,180);
    });

    

    //var img = this.add.image(0,0,'pipe');
    // this.add.line(100,0,100,0,400,400,0xff0000,1);
    
    // img.setInteractive({draggable:true});
    // img.on('dragstart',function (pointer,dragX,dragY) {
    //     console.log('dragstart');
    //     line = new Phaser.Geom.Line(pointer.downX,pointer.downY,pointer.downX+dragX,pointer.downY+dragY);
    //     graphics.lineStyle(1,0x00ff00);
    //     graphics.strokeLineShape(line);
    // });
    // var scene = this;
    // img.on('drag',function (pointer,dragX,dragY) {
    //     console.log('drag');
    //     //line?.destroy();
    //     //line = scene.add.line(pointer.downX+dragX,pointer.downY+dragY,pointer.downX,pointer.downY,0,100,0xff0000);
    //     //line = new Phaser.Geom.Line(pointer.downX+dragX,pointer.downY+dragY,pointer.downX,pointer.downY);
    //     line.x2 = pointer.downX+dragX;
    //     line.y2 = pointer.downY+dragY;

    // });
    // img.on('dragend',function (pointer,dragX,dragY,dropped) {
    //     console.log('dragend');
    // });

    // var particles = this.add.particles('red');

    // var emitter = particles.createEmitter({
    //     speed: 100,
    //     scale: { start: 1, end: 0 },
    //     blendMode: 'ADD'
    // });

    // logo = this.physics.add.image(400, 100, 'logo');

    // logo.setVelocity(100, 200);
    // logo.setBounce(1, 0.5);
    // logo.setCollideWorldBounds(true);

    // emitter.startFollow(logo);

    // platforms = this.physics.add.staticGroup();
    // platforms.create(600,500,'logo').setScale(0.5).refreshBody();
    
    // this.physics.add.collider(logo,platforms);
}
function createStaticPolygon(scene,points,lines){
    
    for(var line of lines){
        createPipeEdges(scene,line);
    }

    for(var point of points){
        const angle_gap = Array.from({ length: 360/15 }, () => 0);

        for (const rad of point.inLineRads) {
            let angle_max = (rad+3.14/2)*180/3.14;
            let angle_min = (rad-3.14/2)*180/3.14;
            
            for (const index in angle_gap) {
                if (angle_min < index*15 && index*15 < angle_max) {
                    angle_gap[index]++;
                }
            }
        }

        let start_angle = undefined;
        for (const index in angle_gap) {
            
            if (start_angle == undefined && angle_gap[index] < 1) {
                start_angle = index*15;
            }
            
            if(start_angle!=undefined && (angle_gap[index] > 0 || parseInt(index)+1 == angle_gap.length)){
                let end_angle = index*15;
                createArcPoligon(scene,point,20,start_angle,end_angle);
                start_angle = undefined;
            }
        }
    }
}

function checkPointer(circle,point) {
    //console.log(Phaser.Geom.Circle.ContainsPoint(circle,point));
    return Phaser.Geom.Circle.ContainsPoint(circle,point);
}

function createArcPoligon(scene,point,radius,start_angle,end_angle){
    let circle_points = [];
    //角度
    const divide_angle = 15;
    const divide_rad = 15*3.14/180;
    for(i=start_angle;i<=end_angle;i+=divide_angle){
        let rad = i*3.14/180;
        let x = radius * Math.cos(rad);
        let y = -radius * Math.sin(rad);
        let circle = scene.matter.add.circle(x+point.x,y+point.y,3,{isStatic:true});
        circle_points.push({x:x,y:y});
    }
    return circle_points;
}


function makeLinePolygon(line,width,height) {
    let polygon = [];
    polygon.push({x:line.x1+width,y:line.y1-height});
    polygon.push({x:line.x1-width,y:line.y1+height});
    polygon.push({x:line.x2-width,y:line.y2+height});
    polygon.push({x:line.x2+width,y:line.y2-height});
    return polygon;
}

function calcLineEdges(line_rad,width){
    //pi/2 = 90
    let residue_rad = (3.14/2)-line_rad;
    let x = width * Math.cos(residue_rad);
    let y = width * Math.sin(residue_rad);
    return {edge_x:x,edge_y:y};
}

function createPipeEdges(scene,line) {
    //角度の計算
    //ragianなので注意。*180/3.14で角度に戻る。
    var rad = Phaser.Geom.Line.Angle(line);
    const {edge_x,edge_y} = calcLineEdges(rad,pipe_width-20);
    
    const edges = calcLineEdges(rad,2);
    const {coll_x,coll_y} = {coll_x:edges.edge_x,coll_y:edges.edge_y};

    //動的polygon生成 右
    var figure = makeLinePolygon(line,coll_x,coll_y);
    let x = ((line.x1+line.x2)/2)+edge_x;
    let y = ((line.y1+line.y2)/2)-edge_y;
    var polygon = scene.add.polygon(x,y,figure,0x0000ff,0.2);
    polygon.setDepth(3);
    //polygon.setDisplayOrigin(0,0);
    test_polygon = polygon;
    scene.matter.add.gameObject(polygon, { isStatic:true ,shape: { type: 'fromVerts', verts: figure, flagInternal: true } });


    //動的polygon生成 ひだり
    figure = makeLinePolygon(line,-coll_x,-coll_y);
    x = ((line.x1+line.x2)/2)-edge_x;
    y = ((line.y1+line.y2)/2)+edge_y;
    polygon = scene.add.polygon(x,y,figure,0x0000ff,0.2);
    polygon.setDepth(3);
    //polygon.setDisplayOrigin(0,0);
    test_polygon = polygon;
    scene.matter.add.gameObject(polygon, { isStatic:true ,shape: { type: 'fromVerts', verts: figure, flagInternal: true } });
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
