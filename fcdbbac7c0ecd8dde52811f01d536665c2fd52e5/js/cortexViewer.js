
if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
      var container, stats;
      var camera, controls, scene, renderer;
      var cross;   
      init();                      
      animate();    
      var faceIndices = [ 'a', 'b', 'c', 'd' ];


      function init() {
        // camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.01, 1e10 );
        camera = new THREE.PerspectiveCamera( 60, 1, 0.01, 1e10 );
        camera.position.z = 100;
        controls = new THREE.TrackballControls( camera );
        controls.rotateSpeed = 5.0;
        controls.zoomSpeed = 5;
        controls.panSpeed = 2;
        controls.noZoom = false;
        controls.noPan = false;
        controls.staticMoving = true;
        controls.dynamicDampingFactor = 0.3;
        scene = new THREE.Scene();
        scene.add( camera );
        // light
        var dirLight = new THREE.DirectionalLight( 0xffffff );
        dirLight.position.set( 200, 200, 1000 ).normalize();
        camera.add( dirLight );
        camera.add( dirLight.target );
        
        // Here have left and right cortices, load them in add them to the scene global variable.
        loadCortex('lhcortex',-20,0,0);            
        loadCortex('rhcortex',+20,0,0);    

  

        // renderer
        renderer = new THREE.WebGLRenderer();
        renderer.setPixelRatio( window.devicePixelRatio );
        // renderer.setSize( window.innerWidth/4, window.innerHeight/4 );
        // renderer.setSize( 500, 500*window.innerHeight/window.innerWidth);
        renderer.setSize( 500, 500);
        // container = document.createElement( 'div' );
        // container = document.getElementById("content");


        // document.body.appendChild( container );
        document.getElementById("canvasWrapper").appendChild( renderer.domElement );

        // container.appendChild( renderer.domElement );
        window.addEventListener( 'resize', onWindowResize, false );        
        requestAnimationFrame( animate );
        controls.update();
        renderer.render( scene, camera );     
      }

      

      function onWindowResize() {
        // So far do nothing for now.
        // camera.aspect = window.innerWidth / window.innerHeight;
        // camera.updateProjectionMatrix();
        // renderer.setSize( window.innerWidth, window.innerHeight );
        // controls.handleResize();
        // check();
        // renderer.setSize( window.innerWidth/4, window.innerHeight/4 );
      }


      function changeOverlay(overlayType)
      {
        scene.children[1].overlayFunction(1,overlayType);
      }
      
      function animate() {
        requestAnimationFrame( animate );
        controls.update();
        renderer.render( scene, camera );        
      }

      // make left and right

      function loadCortex(cortex,xp,yp,zp) {
        var objectCor2
        // Actually have the loader include the other part to make it work
        // var geo = THREE.Geometry();
        // var vertexColorMaterial         
        var loader = new THREE.VTKLoader();
        loader.load( [cortex, 'vtk'].join('.'), function ( geometry ) {
      
          vertexColorMaterial = new THREE.MeshBasicMaterial( { vertexColors: THREE.VertexColors } );
          geo = new THREE.Geometry().fromBufferGeometry( geometry );

          geo.center();
          geo.computeVertexNormals();
                        

          for ( var i = 0; i < geo.vertices.length; i++ ) 
          {
              point = geo.vertices[ i ];              
              color = new THREE.Color( 0xffffff );
              var col_r = 10;//0.5;//colour_red[ i ];
              var col_g = 0;//0.5;//colour_green[ i ];
              var col_b = 0;//.5;//colour_blue[ i ];
              color.setRGB( col_r, col_g, col_b);              
              geo.colors[i] = color; // use this array for convenience
          }
        

      
        
          // copy the colors to corresponding positions 
          //     in each face's vertexColors array.
          for ( var i = 0; i < geo.faces.length; i++ ) 
          {
              face = geo.faces[ i ];
              numberOfSides = ( face instanceof THREE.Face3 ) ? 3 : 4;
              for( var j = 0; j < numberOfSides; j++ ) 
              {
                  vertexIndex = face[ faceIndices[ j ] ];
                  face.vertexColors[ j ] = geo.colors[ vertexIndex ];
              }
          }

          objectCor2 = new THREE.Mesh( geo, vertexColorMaterial );
          objectCor2.position.set( xp, yp, zp );
          objectCor2.scale.multiplyScalar( 0.4 );
          objectCor2.name = cortex;
          // objectCor2.fun = ;
          // objectCor2.callbackFunction = function(){
          //   obj = this;
          //   obj.scale.multiplyScalar( 0.4 );
          // }

          // This is a method within the mesh object, and is needed here to load in the different overlay
          objectCor2.overlayFunction = function(idNumber,overlayType){
            obj = this;
            cortex = obj.name;
            var loader_overlay = new THREE.JSONLoader();
            var request = new XMLHttpRequest();
            // Now we need to open a new request using the open() method. Add the following line:
            request.open('GET', [cortex, overlayType , '.json'].join(''));        
            request.responseType = 'json';
            request.send();
            var color_json;
            geo = obj.geometry;
            request.onload  = function() {
              color_json = request.response;  
              var col = color_json.colour_red[ i ];
              vertexColorMaterial = new THREE.MeshBasicMaterial( { vertexColors: THREE.VertexColors } );

              for ( var i = 0; i < geo.vertices.length; i++ ) 
              {                  
                  color = new THREE.Color( 0xffffff );
                  var col_r = color_json.colour_red[ i ];
                  var col_g = color_json.colour_green[ i ];
                  var col_b = color_json.colour_blue[ i ];
                  color.setRGB( col_r, col_g, col_b);              
                  geo.colors[i] = color; 
              }            

              // copy the colors to corresponding positions 
              //     in each face's vertexColors array.
              for ( var i = 0; i < geo.faces.length; i++ ) 
              {
                  face = geo.faces[ i ];
                  numberOfSides = ( face instanceof THREE.Face3 ) ? 3 : 4;
                  for( var j = 0; j < numberOfSides; j++ ) 
                  {
                      vertexIndex = face[ faceIndices[ j ] ];                      
                      geo.faces[ i ].vertexColors[ j ].set(geo.colors[vertexIndex]);
                  }
                obj.geometry.colorsNeedUpdate = true;      
              }

              // Now this is a curious little recursion, this is needed because there is a hang time with loading up the XMLHttpRequest methods
              // This ensures to update the second mesh only after everything has finished loading as opposed to explicitly stating it in the
              // to do : 
              // scene.children[1].overlayFunction();
              // scene.children[2].overlayFunction();
              // This seems to work nicely!
              if(idNumber<2){
                scene.children[2].overlayFunction(2,overlayType);
              }
                
              }                        

          }


          scene.add( objectCor2 );
        });
    };

      

    