/**
 * Game.js
 * This is the main game object which controls gameloop and basically everything in the game
 *
 *  License: Apache 2.0
 *  author:  Ciar�n McCann
 *  url: http://www.ciaranmccann.me/
 */
///<reference path="system/Camera.ts"/>
///<reference path="system/Graphics.ts"/>
///<reference path="system/AssetManager.ts"/>
///<reference path="system/Physics.ts"/>
///<reference path="Terrain.ts"/>
///<reference path="Worm.ts"/>
///<reference path="system/Utilies.ts"/>
///<reference path="gui/WeaponsMenu.ts" />
///<reference path="Player.ts" />
///<reference path="system/Timer.ts" />
///<reference path="Settings.ts" />
///<reference path="CountDownTimer.ts" />
///<reference path="animation/SpriteDefinitions.ts" />
///<reference path="animation/ParticleEffect.ts"/>
///<reference path="animation/EffectsManager.ts"/>
///<reference path="gui/HealthMenu.ts"/>
///<reference path="Maps.ts"/>
///<reference path="GameStateManager.ts"/>
///<reference path="WormManager.ts"/>

class Game
{
    terrainCanvas;
    terrainCanvasContext;

    actionCanvas;
    actionCanvasContext;

    terrain: Terrain;
    players: Player[];

    weaponMenu: WeaponsMenu;
    healthMenu: HealthMenu;

    wormManager: WormManager;
    gameState: GameStateManager;

    gameTimer: CountDownTimer;
    currentPlayerIndex: number;

    isStarted: bool;
    particleEffectMgmt: EffectsManager;

    // TODO clean this up -just made it static to get it working
    static map: Map = new Map(Maps.priates);

    camera: Camera;

    //Using in dev mode to collect spawn positions
    spawns; 

    constructor ()
    {
        Graphics.init();       

        this.currentPlayerIndex = 0;

        this.weaponMenu = new WeaponsMenu();
        this.gameTimer = new CountDownTimer();

        //Create action canvas
        this.actionCanvas = Graphics.createCanvas("action");
        this.actionCanvasContext = this.actionCanvas.getContext("2d");

        //Set canvas font stuff
        this.actionCanvasContext.font = 'bold 16px Sans-Serif';
        this.actionCanvasContext.textAlign = 'center';

        Physics.init(this.actionCanvasContext);
        

        this.terrain = new Terrain(this.actionCanvas,  Game.map.getTerrainImg(), Game.map.getBackgroundCss(), Physics.world, Physics.worldScale);
        this.camera = new Camera(this.terrain.getWidth(), this.terrain.getHeight(),  this.actionCanvas.width, this.actionCanvas.height);


        this.players = [];
        for (var i = 0; i < 2; i++)
        {
            this.players.push(new Player());
        }

        this.wormManager = new WormManager(this.players);
        this.gameState = new GameStateManager();

        this.isStarted = false;

        this.spawns = [];

        if (Settings.DEVELOPMENT_MODE)
        {
            window.addEventListener("click", function (evt: any) =>
            {
                this.particleEffectMgmt.add(new ParticleEffect(this.camera.getX() + evt.pageX, this.camera.getY() + evt.pageY));
                this.spawns.push(new b2Vec2(this.camera.getX() + evt.pageX, this.camera.getY() + evt.pageY));
                Logger.log(JSON.stringify(this.spawns));

            }, false);
        }

        this.particleEffectMgmt = new EffectsManager();

    }

    start()
    {
        this.gameTimer.timer.reset();
        this.isStarted = true;
        this.healthMenu = new HealthMenu(this.players);
    }

    getCurrentPlayerObject()
    {
        return this.players[this.currentPlayerIndex];
    }

    nextPlayer()
    {

        if (this.currentPlayerIndex + 1 == this.players.length)
        {
            this.currentPlayerIndex = 0;
        }
        else
        {
            this.currentPlayerIndex++;                
        }

        this.getCurrentPlayerObject().getTeam().nextWorm();    
        GameInstance.camera.panToPosition(Physics.vectorMetersToPixels(this.getCurrentPlayerObject().getTeam().getCurrentWorm().body.GetPosition()));
       
        this.gameTimer.timer.reset();
        
    }

    checkForEndGame()
    {
        var playersStillLive = [];
        for (var i = this.players.length - 1; i >= 0; --i)
        {
            if (this.players[i].getTeam().getPercentageHealth() > 0)
            {
                playersStillLive.push(this.players[i]);
            }
        }

        if (playersStillLive.length == 1)
        {
           playersStillLive[0].getTeam().winner();
           //playersStillLive[0].getTeam().update();
           return true;
        }

        return false;
    }

    update()
    {
        if (this.isStarted)
        {
            if (this.gameState.readyForNextTurn())
            {
                this.nextPlayer();
            }


                //if the game has ended don't update anything but the
                // winning player and the particle effects.
                var gameWinner = this.checkForEndGame();

                //TODO remove temp fix
                //if (this.getCurrentPlayerObject().getTeam().getCurrentWorm().isDead)
                //{
                //    this.getCurrentPlayerObject().getTeam().nextWorm();
                //}
                
                for (var i = this.players.length - 1; i >= 0; --i)
                {
                        this.players[i].update();
                }

                this.terrain.update();
                this.camera.update();
                this.particleEffectMgmt.update();

                if (gameWinner == false)
                {
                    this.gameTimer.update();
                }

               // Logger.log(this.wormManager.areAllWormsStationary());
           
        }

    }

    step()
    {
        if (this.isStarted)
        {
            Physics.world.Step(
                  (1 / 60)
               , 10       //velocity iterations
               , 10       //position iterations
            );
        }
        //Physics.world.ClearForces();
    }

    draw()
    {
      
       this.actionCanvasContext.clearRect(0, 0, this.actionCanvas.width, this.actionCanvas.height);
       this.terrain.draw(this.actionCanvasContext);

       this.actionCanvasContext.save();
       this.actionCanvasContext.translate(-this.camera.getX(), -this.camera.getY());

        if (Settings.PHYSICS_DEBUG_MODE)
        Physics.world.DrawDebugData();

        
        for (var i = this.players.length - 1; i >= 0; --i)
        {
            this.players[i].draw(this.actionCanvasContext);
        }
         this.particleEffectMgmt.draw(this.actionCanvasContext);

        this.actionCanvasContext.restore();
        
    }

}