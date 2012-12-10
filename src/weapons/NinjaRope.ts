/**
 * NinjaRope.js
 *
 *  License: Apache 2.0
 *  author:  Ciar�n McCann
 *  url: http://www.ciaranmccann.me/
 */
///<reference path="../system/Graphics.ts"/>
///<reference path="../system/AssetManager.ts"/>
///<reference path="../system/Physics.ts"/>
///<reference path="../Terrain.ts"/>
///<reference path="BaseWeapon.ts"/>


class NinjaRope extends BaseWeapon
{
    ropeJoints;
    ropeNots;
    anchor;
    lastRopeDef;
    playerJoint;

    constructor ()
    {
        super(
           "Ninja Rope",
           3,
         Sprites.weaponIcons.ninjaRope,
         Sprites.worms.takeNinjaRope,
         Sprites.worms.aimNinjaRope
       );

        this.ropeJoints = [];
        this.ropeNots = [];
        this.lastRopeDef;

    }


    activate(worm: Worm)
    {
        this.worm = worm;

        if (!this.getIsActive())
        {

            var dir = worm.target.getTargetDirection().Copy();
            dir.Multiply(20);
            var contact = Physics.shotRay(worm.body.GetPosition(), dir);

            if (contact)
            {
                this.isActive = true;
                var fixDef = new b2FixtureDef;
                fixDef.density = 0.5;
                fixDef.friction = 1.0;
                fixDef.restitution = 0.0;
                fixDef.shape = new b2PolygonShape;
                fixDef.shape.SetAsBox(0.2, 0.2);

                var bodyDef = new b2BodyDef;
                bodyDef.type = b2Body.b2_staticBody;
                bodyDef.position.x = contact.x;
                bodyDef.position.y = contact.y;

                this.anchor = Physics.world.CreateBody(bodyDef).CreateFixture(fixDef).GetBody()
                fixDef.shape.SetAsBox(0.2, 0.2);
                fixDef.shape = new b2CircleShape(0.15);


                var ropeDef = new b2DistanceJointDef();
                ropeDef.frequencyHz = 10.0;
                ropeDef.dampingRatio = 50.0;

                var prevBody = this.anchor;
                var direction = this.anchor.GetPosition().Copy();
                var wormPos = worm.body.GetPosition().Copy();
                wormPos.Subtract(direction);

                var distance = 5;

                if (wormPos.Length() > distance)
                    distance = Math.floor(wormPos.Length() / 0.5);

                wormPos.Normalize();
                direction = wormPos;

                for (var i = 1; i < distance; ++i)
                {
                    var bd = new b2BodyDef();
                    bd.type = b2Body.b2_dynamicBody;

                    var pos = this.anchor.GetPosition().Copy();
                    var dScaled = direction.Copy();
                    dScaled.Multiply(0.5 * i);
                    pos.Add(dScaled);


                    bd.position.SetV(pos);

                    var nextBody;
                    if (i == distance - 1)
                    {
                        ropeDef.frequencyHz = 25.0;
                        // ropeDef.dampingRatio = 25.0;
                        nextBody = worm.body;

                    }
                    else
                    {
                        nextBody = Physics.world.CreateBody(bd)
                        nextBody.CreateFixture(fixDef);
                        nextBody.SetFixedRotation(true);
                        this.lastRopeDef = ropeDef;
                        this.ropeNots.push(nextBody);
                    }
                    ropeDef.bodyA = prevBody;
                    ropeDef.bodyB = nextBody;


                    var joint = Physics.world.CreateJoint(ropeDef);
                    this.ropeJoints.push(joint);

                    joint.SetLength(0.02);
                    prevBody = nextBody;
                }

                //var joint  = Physics.world.CreateJoint(ropeDef);
                //this.ropeJoints.push( joint );

            }
        } else
        {
            //Physics.world.DestroyJoint(this.ropeJoint);
            // Physics.world.DestroyBody(this.anchor);
            //this.contract();

        }

        //super.activate(worm);
    }

    contract()
    {
        if (this.ropeJoints.length > 3 && this.ropeNots.length > 3)
        {
           // var p =  this.ropeJoints.pop();
            var lastJoint = this.ropeJoints[this.ropeJoints.length - 2];
            var lastBody = this.ropeNots.pop();
            Physics.world.DestroyBody(lastBody);


            this.lastRopeDef.bodyA = this.ropeNots[this.ropeNots.length - 1];
            this.lastRopeDef.bodyB = this.worm.body;


            var joint = Physics.world.CreateJoint(this.lastRopeDef);
            joint.SetLength(0.02);
            Physics.world.DestroyJoint(this.ropeJoints.pop());
            Physics.world.DestroyJoint(this.ropeJoints.pop());
            this.ropeJoints.push(joint);
           // this.ropeJoints.push(p);
            joint.SetLength(0.2);
        }
    }


    expand()
    {
         if (this.ropeJoints.length < 50 && this.ropeNots.length < 50)
        {
            Physics.world.DestroyJoint(this.ropeJoints.pop());
            var lastBody = this.ropeNots[this.ropeNots.length - 1];
            var lastJoint = this.ropeJoints[this.ropeJoints.length - 1];

            var fixDef = new b2FixtureDef;
            fixDef.density = 0.5;
            fixDef.friction = 1.0;
            fixDef.restitution = 0.0;
            fixDef.shape = new b2CircleShape(0.15);

            var bd = new b2BodyDef();
            bd.type = b2Body.b2_dynamicBody;
             var direction = this.worm.body.GetPosition().Copy();
             var wormPos = lastBody.GetPosition().Copy();
              wormPos.Subtract(direction);
              wormPos.Multiply(0.8);
              wormPos.Add(this.worm.body.GetPosition());
            bd.position.SetV(wormPos);

            var nextBody = Physics.world.CreateBody(bd)
            nextBody.CreateFixture(fixDef);
            nextBody.SetFixedRotation(true);

            this.lastRopeDef.bodyA = lastBody;
            this.lastRopeDef.bodyB = nextBody;

            this.ropeNots.push(nextBody);

            var joint = Physics.world.CreateJoint(this.lastRopeDef);
            this.ropeJoints.push(joint);
            joint.SetLength(0.3);
            this.lastRopeDef.bodyA = nextBody;
            this.lastRopeDef.bodyB = this.worm.body;
            this.playerJoint = Physics.world.CreateJoint(this.lastRopeDef)
            this.ropeJoints.push(this.playerJoint);



        }
    }



    draw(ctx)
    {
        //var context = ctx;
        //for (var i = 0; i < this.ropeNots.length-2; i += 2)
        //{
        //        var p1 = Physics.vectorMetersToPixels(this.ropeNots[i].GetPosition());
        //        var p2 = Physics.vectorMetersToPixels(this.ropeNots[i+2].GetPosition());
        //        context.strokeStyle = "rgb(0, 25, 25)";
        //        context.lineWidth = 8;
        //        context.beginPath(); // Start the path
        //        context.moveTo(p1.x, p1.y); // Set the path origin
        //        context.lineTo(p2.x, p2.y); // Set the path destination
        //        context.closePath(); // Close the path
        //        context.stroke();
        //}
    }

}