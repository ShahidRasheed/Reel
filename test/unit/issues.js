/**
 * .reel Unit Tests
 */
(function($){

  var
    browser = (function( ua ) {
      // Adapted from jQuery Migrate
      // https://github.com/jquery/jquery-migrate/blob/master/src/core.js
      var
        match = /(chrome)[ \/]([\w.]+)/.exec( ua ) ||
                /(webkit)[ \/]([\w.]+)/.exec( ua ) ||
                /(opera)(?:.*version|)[ \/]([\w.]+)/.exec( ua ) ||
                /(msie) ([\w.]+)/.exec( ua ) ||
                ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec( ua ) ||
                [],
        browser = {
          browser: match[ 1 ] || "",
          version: match[ 2 ] || "0"
        }

      if (browser.browser){
        browser[browser.browser] = true;
      }
      return browser;

    })(navigator.userAgent.toLowerCase())

  module('Issues', reel_test_module_routine);

  asyncTest( 'GH-243 Preloading of images', function(){
    /* Github issue 243
     * Problems with loading in IE 6 and 7 when using jQuery 1.7.1 up to 1.9.1
     * http://github.com/pisi/Reel/issues/243
     */
    var
      $reel= $('#image'),
      hits= 0

    expect( 11 );

    $(document).bind('preload.test', function(){
      ok( true, 'Preload triggered');
      ok( $.reel.instances.reel('cache').jquery, 'Preloading cache jQuery collection exists');
      equal( $.reel.instances.reel('cache').length, 1, 'Preloading cache population');

      setTimeout(function(){
        var
          src= $reel.reel('cache').children().attr('src')
  
        ok( src && src.match($.reel.re.path), 'Image `src` has been assigned for the actual preload');
        ok( !$reel.is('.reel-loading'), 'Loading flag has been removed from the instance');
        ok( !$reel.reel('loading'), 'Loading state updated');
        ok( hits > 5, 'Actually animating');

        start();
      }, 1000);
    });

    $(document).bind('loaded.test', function(){
      ok( true, 'Image has been loaded');
    });

    $(document).bind('preloaded.test', function(){
      ok( true, 'All images have been loaded. Preload finished'); // because it is just one image
    });

    $(document).bind('play.test', function(){
      ok( true, 'Animation played');
      ok( $reel.reel('playing'), 'Reel is playing');
    });

    $(document).bind('frameChange.test', function(){
      hits++;
    });

    $reel.reel({
      speed: 1
    })

  });

  asyncTest( 'GH-4 Proper background positioning range for stitched non-looping panoramas', function(){
    /* Github issue 4 bugfix
     * http://github.com/pisi/Reel/issues/#issue/4
     */
    var
      iesaurus = browser.msie && +browser.version < 9, // Flag for IE 8- quirks
      stitched= 1652,
      $pano= $('#stitched_nonlooping').reel({ stitched: stitched, loops: false }),
      travel= stitched - parseInt($pano.css('width'))

    expect(iesaurus ? 4 : 2);

    $(document).bind('loaded.test', function(){
      $pano.reel('frame', 1);
      if (iesaurus){
        equiv($pano.css('backgroundPositionX'), '0px', 'Frame 1 (min, X)');
        equiv($pano.css('backgroundPositionY'), '0px', 'Frame 1 (min, Y)');
      }else{
        equiv($pano.css('backgroundPosition'), '0px 0px', 'Frame 1 (min)');
      }
      $pano.reel('frame', 36);
      if (iesaurus){
        equiv($pano.css('backgroundPositionX'), -travel+'px', 'Frame 36 (max, X)');
        equiv($pano.css('backgroundPositionY'), '0px', 'Frame 36 (max, Y)');
      }else{
        equiv($pano.css('backgroundPosition'), -travel+'px 0px', 'Frame 36 (max)');
      }
      start();
    });

  });

  asyncTest( 'GH-6 Proper background positioning range for stitched looping panoramas', function(){
    /* Github issue 6 bugfix
     * http://github.com/pisi/Reel/issues/#issue/6
     */
    var
      iesaurus = browser.msie && +browser.version < 9, // Flag for IE 8- quirks
      stitched= 1652,
      $pano= $('#stitched_looping').reel({ stitched: stitched, loops: true }),
      travel= stitched

    expect(iesaurus ? 4 : 2);

    $(document).bind('loaded.test', function(){
      $pano.reel('frame', 1);
      if (iesaurus){
        equiv($pano.css('backgroundPositionX'), '0px', 'Looping - frame 1 (min, X)');
        equiv($pano.css('backgroundPositionY'), '0px', 'Looping - frame 1 (min, Y)');
      }else{
        equiv($pano.css('backgroundPosition'), '0px 0px', 'Looping - frame 1 (min)');
      }
      $pano.reel('frame', 36);
      if (iesaurus){
        equiv($pano.css('backgroundPositionX'), '0px', 'Looping - frame 36 (max, X)');
        equiv($pano.css('backgroundPositionY'), '0px', 'Looping - frame 36 (max, Y)');
      }else{
        equiv($pano.css('backgroundPosition'), '0px 0px', 'Looping - frame 36 (max)');
      }
      start();
    });
  });

  asyncTest( 'GH-11 First frame disappears after image sequence loading is complete', function(){
    /* Github issue 11 bugfix
     * http://github.com/pisi/Reel/issues/#issue/11
     * Replacement of original image source with embedded transparent sprite
     * can not happen when using `images` option
     */
    expect(1);
    var
      $pano= $('#sequence').reel({
        footage:  10,
        cw:       true,
        orbital:  3,
        inversed: true,
        path:     'resources/phone/',
        images:   phone_frames(20)
      })

    $(document).bind('loaded.test', function(){
      equal($pano.attr('src'), 'resources/phone/01.png', 'Image is from the sequence');
      start();
    });

    /*
      Borrowed from test/sampler.html
    */
    function phone_frames(frames){
      var every= 1, stack= []
      for(var i= 1; i <= frames; i+= every){
        var name= [i, '.png'].join('')
        while (name.length < 6) name= '0'+name
        stack.push(name)
      }
      return stack
    }
  });

  asyncTest( 'GH-30 Broken "play" in IE', function(){
    /* Github issue 30 bugfix
     * http://github.com/pisi/Reel/issues/#issue/30
     * First of all, private `slidable` boolean flag leaked into global scope
     * and also caused Reel to throw JS errors.
     * Then adaptive ticker timeout sometimes went sub-zero causing IE to invalidate such `setTimeout` call
     * and thus effectively ceised the timer completely.
     * Another IE issue: broken image overlay in IE 7 or lower was caused by no support for "data:" protocol URLs,
     * so to workaround it a CDN-served blank image is be used instead.
     */
    expect(4);
    var
      $pano= $('#image').reel(),
      ticks= 0

    equal(typeof slidable, 'undefined', '`slidable` is undefined in the global scope');
    equal(typeof window.slidable, 'undefined', '`window.slidable` is also undefined');

    $(document).bind('tick.reel.test', function(){
      ticks++;
      if (ticks == 100){
        ok(true, 'Ticked 100 times - ticker runs ;)');

        var
          protocol= $('#image').attr('src').split(':')[0],
          dot= '.',
          browser_version= +browser.version.split(dot).slice(0,2).join(dot),
          ie= browser.msie

        if (!ie || (ie && browser_version > 7)){
          equal(protocol, 'data', 'Embedded transparent image.');
        }else{
          equal(protocol, 'http', 'Transparent image from CDN.');
        }

        start();
      }
    });
  });

  asyncTest( '`stage_pool` private variable leaked into global scope', function()
  {
    expect(1);

    var
      $reel= $('#image').reel()

    setTimeout(function(){
      ok( typeof stage_pool === 'undefined', 'No leaked `stage_pool` accessible in the global scope');
      start();
    }, 100)
  });

  asyncTest( '`footage` private variable leaked into global scope', function()
  {
    expect(1);

    var
      $reel= $('#image').reel()

    setTimeout(function(){
      ok( typeof footage === 'undefined', 'No leaked `footage` accessible in the global scope');
      start();
    }, 100)
  });

  asyncTest( 'Teardown doesn\'t propagate the cloned original image down the chain', function(){
    /*
     * When Reel instance is torn down and `.reel()` is called again in the same chain,
     * the instance isn't properly initialized.
     * The cloned-back original `IMG` tag doesn't propagate as a proper target
     * for subsequent `.reel()` calls. These don't fail (as they are most probably
     * performed upon the old now detached DOM node. The extra selector evaluation
     * is therefore required in order to further manipulate the node.
     */
    expect( 3 );

    var
      $reel= $('#image').reel().bind('click.test', function(){
        ok( true, 'Event binding is preserved');
      });

    setTimeout( function(){
      $reel.unreel().reel();
      ok( $reel.is('.reel'), 'IMG tag is flagged as a Reel instance');
      ok( $reel.parent().is('.reel-overlay'), 'and wrapped in overlay DIV');
      $reel.click();
      $reel.removeAttr('onclick'); // for IE8-
      start();
    }, 500 );
  });

    /* Github issue 46 bugfix
     * http://github.com/pisi/Reel/issues/#issue/46
     * When topmost row has been reached with dragging, the instance freeze in that row
     * no matter the vertical direction of the drag. Instance then has to be dragged
     * left or right to restore the vertical movement. Unfortunately enough
     * this happens for all frames lying on the first row and especially the default value.
     *
     * This bug expresses itself by locking vertical reel in the topmost row
     * and preventing proper `row` > `frame` propagation unless horizontal drag
     * is performed.
     */
  $.each([
    1,
    2
  ],
  function(ix, row){
    $.each([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
      11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
      31, 32, 33, 34, 35, 36
    ],
    function(iix, frame){
      asyncTest( 'GH-46 Incorrect `row` to `frame` translation in multi-row movies (' + row + '/2 to ' + frame + '/36)', function(){
        expect( 3 );
        var
          rows= 2,
          frames= 36, // default
          $pano= $('#image').reel({
            frame: frame,
            rows: rows,
            row: row
          })

        $(document).bind('loaded.test', function(){

          // Click and drag long way down
          $pano.trigger('down', [ 100, 200 ]);
          $pano.trigger('pan', [ 100, 400 ]);
          deepEqual({ row: $pano.data('row'), tier: $pano.data('tier'), frame: $pano.data('frame') },
                    { row: rows,              tier: 1,                  frame: rows * frames - frames + frame },
                    'Drag way down on frame '+frame+' / '+frames+', row '+row+' / '+rows);

          // `tick` needs to be triggered manually between `pan`s in order to have the instance slidable again
          $pano.trigger('tick');

          // Then drag it all the way back up to reach the first row
          $pano.trigger('pan', [ 100, 1 ]);
          deepEqual({ row: $pano.data('row'), tier: $pano.data('tier'), frame: $pano.data('frame') },
                    { row: 1,                 tier: 0,                  frame: frame },
                    '& drag way up');

          $pano.trigger('tick');

          // Then drag it back all the way down
          $pano.trigger('pan', [ 100, 400 ]);
          deepEqual({ row: $pano.data('row'), tier: $pano.data('tier'), frame: $pano.data('frame') },
                    { row: rows,              tier: 1,                  frame: rows * frames - frames + frame },
                    '& drag way down again.');

          // Conclude the drag
          $pano.trigger('up');
          start();

        })
      });
    });
  });

  asyncTest( 'GH-62 Implicit teardown', function(){
    /*
     * Unable to switch Reels in a simple manner without a manual teardown.
     */
    expect( 1 );
    var
      image = undefined,
      $reel = $('#image').reel()

    $(document).bind('loaded.test', function(){
      if (image === undefined){
        image= $reel.data('image');
        var
          new_instance= $reel.reel({
            image: 'resources/green-reel.jpg'
          });

        // Finish the test in case reel initialization fails
        if (!new_instance.length){
          ok( false, 'Unable to instantitate the same DOM node for the second time');
          start();
        }
      }else{
        ok( image !== $reel.data('image'), 'The second reel image is different than the first one');
        start();
      }
    });
    $('#image').reel();
  });

  asyncTest( 'GH-103 Incorrect frame with vertical sprite organization', function(){
    /*
     * When using 'vertical:true' with images array the reel starts at frame (image) number 7
     * and continue past the end of the array with image url "undefined"
     */
    expect( 4 );
    var
      images = (function(){
        var images= []
        for (var i= 0; i < 15; i++) images.push('resources/phone/01.png?' + (i+1))
        return images
      })(),
      $reel = $('#image').reel({
        vertical: true,
        images: images
      })

    $(document).bind('loaded.test', function(){
      equal( $reel.data('frame'), 1);
      equal( $reel.attr('src'), images[0]);

      $reel.reel('frame', 15);
      equal( $reel.data('frame'), 15);
      equal( $reel.attr('src'), images[14]);
      start();
    })
  });

  asyncTest( 'GH-113 Unescaped sprite URIs cause nothing to be displayed', function(){
    /*
     * When image URL contains an unescaped space, this is not further handled by Reel
     * resulting in a non-working URL used and nothing displayed.
     */
    expect( 2 );
    var
      raw = 're sources/object-reel.jpg',
      escaped = 're%20sources/object-reel.jpg',
      $reel = $('#image_with_unescaped_url').reel()

    $(document).bind('loaded.test', function(){
      var
        // Isolate the actual filename used
        image = $reel.css('backgroundImage').replace(/['"]?\)$/, '')
        actual = image.substr(image.length - escaped.length)

      equal( $reel.data('image'), raw, 'Given raw image URL (escaped or unescaped)');
      equal( actual, escaped, 'Actual escaped URL used');
      start();
    })
  });

  asyncTest( 'GH-113 Unescaped sequence URIs cause nothing to be displayed', function(){
    /*
     * When image or sprite URL contains an unescaped space, this is not further handled by Reel
     * resulting in a non-working URL used and nothing displayed.
     */
    expect( 2 );
    var
      sequence= 're sources/phone/##.jpg'
      raw=      're sources/phone/01.jpg',
      escaped=  're%20sources/phone/01.jpg',
      $reel = $('#image_with_unescaped_url').reel({
        frames: 2,
        images: sequence
      })

    $(document).bind('loaded.test', function(){
      equal( $reel.data('images')[0], raw, 'Given raw sequence frame URL (escaped or unescaped)');
      equal( $reel.attr('src'), escaped, 'Actual escaped URL used');
      start();
    })
  });

  asyncTest( 'GH-117 Ticker does not restart after instance gets lost from the DOM', function(){
    /*
     * When an instance is removed from the DOM indirectly by removing some of its ancestors
     * and another instances is created, the new one doesn't animate and can not be dragged
     * [demo](http://jsfiddle.net/FeeDy/2/)
     */
    expect( 5 );
    var
      $container = $('#non_image'),
      $image = $('<img>', {
        id: 'injected_image',
        src: 'resources/object.jpg',
        width: 276,
        height: 126
      }).appendTo($container),
      $reel = $('#injected_image').reel({
        frames: 35,
        speed: 0.2
      })

    $(document).one('loaded.test', function(){
      $container.empty();
      ok( !$('#injected_image').length, '`#injected_image` no longer present in the DOM' )
      equal( $.reel.leader('tempo'), null, 'No leader tempo, ticker stopped' );

      var
        ticked= false

      $(document).bind('tick.reel.test', function(){
        ticked= true;
      });
      setTimeout(function(){
        ok( !ticked, 'Ticker positively not ticking');
        var
          new_tempo = 15,
          lazy_tempo = new_tempo / ($.reel.lazy? $.reel.def.laziness : 1),
          $container = $('#non_image'),
          $image = $('<img>', {
            id: 'injected_image',
            src: 'resources/object.jpg',
            width: 276,
            height: 126
          }).appendTo($container),
          $reel = $('#injected_image').reel({
            frames: 35,
            tempo: new_tempo,
            speed: 0.2
          })

        $(document).bind('loaded.test', function(){
          var
            ticked= false

          $(document).bind('tick.reel.test', function(){
            ticked= true;
          });
          setTimeout(function(){
            equal( $.reel.leader('tempo'), lazy_tempo, 'Leader tempo reported again' );
            ok( ticked, 'Newly created instance restarts the ticker')
            $container.empty();
            start();
          }, 500);
        });
      }, 200);
    })
  });

  asyncTest( 'GH-125 URLs containing parentheses fail when used in `background` CSS declaration', function(){
    /*
     * When image or sprite URL contains an unescaped space, this is not further handled by Reel
     * resulting in a non-working URL used and nothing displayed.
     */
    expect( 1 );
    var
      url=      'resources/object(2).jpg',
      sprite=   'resources/object(2)-reel.jpg',
      $reel = $('#image').reel({
        attr: {
          src: url
        }
      })

    $(document).bind('loaded.test', function(){
      var
        image= $reel.css('backgroundImage').replace(/['"]?\)$/, ''),
        is= image.substr(image.length - sprite.length)
      equal( is, sprite );
      start();
    })
  });

  $.each({
    'non-steppable': {
      steppable: false,
      label: 'Only the plain `up` event handler is bound',
      expect: 1
    },
    'steppable': {
      steppable: true,
      label: 'One plain `up` and one `up.steppable` event handlers are bound',
      expect: 2
    }
  }, function(name, def){
    asyncTest( 'GH-126 Disabling stepping with `steppable` option ('+name+' case)', function(){
      /*
       * The stepping click handler of the `up.steppable` event hasn't been properly unbinded
       * when `steppable` option is set to `false`.
       */
      expect( 1 );
      var
        $reel = $('#image').reel({
          steppable: def.steppable
        })

      $(document).bind('loaded.test', function(){
        var
          $area= $reel.reel('area')

        equal( $._data($area[0], 'events')['up'].length, def.expect, def.label);
        start();
      })
    });
  });

  asyncTest( 'GH-188 Sprite acts like directional when it is not', function(){
    /*
     * Sprites had been treated as directional ones even when directional mode was not eanbled
     * causing unwanted shifts of sprites in backwards motion.
     */
    expect( 2 );
    var
      $reel = $('#image').reel({
        directional: false
      })

    $(document).bind('loaded.test', function(){
      var
        background= $reel.css('backgroundPosition') || '0px 0px'

      equiv( 0, background.split(' ')[1], 'Non-directional sprite stays at 0px vertically');

      $reel.reel('backwards', true);
      $reel.reel('frame', 3);

      var
        background= $reel.css('backgroundPosition') || '0px 0px'

      equiv( 0, background.split(' ')[1], 'Even when in backwards motion');
      start();
    })
  });

  $.each([
    'image.png?54351531676',
    'test.png?thumbnail',
    'images/test.png?width=200&height=2000&quality=high',
    'http://example.com/images/test.png?width=2000&height=200'
  ], function(name, url){
    asyncTest( 'GH-187 Query vars preserve in URLs like "'+url+'" (via `image` option)', function(){
      expect( 1 );
      var
        $reel = $('#image2').reel({
          image: url,
          frames: 2
        })

      $(document).bind('loaded.test', function(){
        ok( matchingURL($reel.css('backgroundImage'), url), url );
        start();
      })
    });
  });

  $.each({
    'image###.png?54351531676':                             'image001.png?54351531676',
    'test#.png?thumbnail':                                  'test1.png?thumbnail',
    'test.png?number=#':                                    'test.png?number=1',
    'images/test##.png?width=200&height=2000&quality=high': 'images/test01.png?width=200&height=2000&quality=high',
    'http://example.com/images/test-####.png?w=2000&h=200': 'http://example.com/images/test-0001.png?w=2000&h=200'
  }, function(use, should){
    asyncTest( 'GH-187 Query vars preserve in URLs like "'+use+'" (via `images` option)', function(){
      expect( 1 );
      var
        $reel = $('#image2').reel({
          images: use,
          frames: 2
        })

      $(document).bind('loaded.test', function(){
        equal( $reel.attr('src'), should );
        start();
      });
    });
  });

  $.each({
    'resources/object.jpg?width=2000&height=200': 'resources/object-reel.jpg'
  }, function(src, url){
    asyncTest( 'GH-187 Query vars NOT carried over from URL in image tag\'s `src` like "'+src+'"', function(){
      expect( 1 );
      var
        $reel = $('#image2').reel({
          frames: 2
        })

      $(document).bind('loaded.test', function(){
        ok( matchingURL($reel.css('backgroundImage'), url), url );
        start();
      })
    });
  });
  function matchingURL(css, url){
    var
      match= css.match(/^url\(['"]?([^'"]+)['"]?\)$/)
    return match && url == match[1].substr(match[1].length - url.length);
  }


  asyncTest( 'GH-219 Annotations\'s `click` event bubbling', function(){
    expect( 3 );
    var
      $reel = $('#image').reel({
        annotations: {
          'link': {
            x: 10,
            y: 10,
            link: {
              href: 'Somewhere'
            }
          }
        }
      })

    $(document).bind('click.test', function( e ){
      ok( true, 'Event bubbled through the DOM all the way up to the document' );
    });
    $(document).bind('loaded.test', function(){
      $('#link a').click(function( e ){
        ok( true, 'Registered `click` on the link' );
      });
      $('#link').click(function( e ){
        ok( true, 'Registered `click` on the annotation' );
      });
      $('#link a').click();
      start();
    })
  });

  asyncTest( 'GH-42 Incorrect starting frame', function(){
    /* Github issue 42 bugfix
     * http://github.com/pisi/Reel/issues/#issue/42
     */
    var
      $reel,
      frames = 35

    expect( frames );

    tryout( frames );

    function tryout( frame ){
      if ( frame > 0 ){
        $reel = $('#image').reel({
          frames: frames,
          frame: frame,
          cw: true,
          images: 'resources/mini/###.gif'
        })

        $(document)
          .one('loaded.test', function(){
            equal( $reel.reel('frame'), frame );
            tryout( frame - 1 );
          });
      }else{
        start();
      }
    }
  });

  asyncTest( 'GH-244 Looping of fraction in non-looping multirow setups', function(){
    /* Github issue 244 bugfix
     * http://github.com/pisi/Reel/issues/244
     */
    expect( 2 );

    var
      $reel= $('#image').reel({
        rows: 3,
        row: 2,
        frames: 10,
        frame: 6,
        loops: false
      })

    $(document).bind('loaded.test', function(){

      $reel.reel('fraction', 0);
      equal( $reel.reel('frame'), 11, 'First frame of row 2');

      $reel.reel('fraction', 1);
      equal( $reel.reel('frame'), 20, 'Last frame of row 2');

      start();
    });

  });

})(jQuery);
