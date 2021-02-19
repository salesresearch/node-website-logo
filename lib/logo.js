var url = require( 'url' )
var request = require( 'simple-get' )
var html = require( 'htmlparser2' )
var pkg = require( '../package.json' )
var DOMHandler = require( './dom-handler' )

function firstChild( root, nodeName ) {
  return root && root.children && root.children.length &&
    root.children.find(( node ) => node.name === nodeName ) || null
}

function findChildren( root, fn ) {
  return root && root.children && root.children.filter( fn ) || []
}

function findChild( root, fn ) {
  return root && root.children && root.children.find( fn ) || null
}

function getName( root ) {
  var html = firstChild( root, 'html' )
  var head = firstChild( html, 'head' )
  var metaDesc = findChild( head, ( node ) => {
    return node.name == 'title' && node.textContent
  })
  var ogDesc = findChild( head, ( node ) => {
    return node.name == 'meta' && node.attr.property == 'og:site_name'
  })
  return ( ogDesc && ogDesc.attr.content ) ||
    ( metaDesc && metaDesc.textContent ) || null
}

function getTitle( root ) {
  var html = firstChild( root, 'html' )
  var head = firstChild( html, 'head' )
  var metaDesc = findChild( head, ( node ) => {
    return node.name == 'title' && node.textContent
  })
  var ogDesc = findChild( head, ( node ) => {
    return node.name == 'meta' && node.attr.property == 'og:title'
  })
  return ( ogDesc && ogDesc.attr.content ) ||
    ( metaDesc && metaDesc.textContent ) || null
}

function getDescription( root ) {
  var html = firstChild( root, 'html' )
  var head = firstChild( html, 'head' )
  var metaDesc = findChild( head, ( node ) => {
    return node.name == 'meta' && node.attr.name == 'description'
  })
  var ogDesc = findChild( head, ( node ) => {
    return node.name == 'meta' && node.attr.property == 'og:description'
  })
  return ( metaDesc && metaDesc.attr.content ) ||
    ( ogDesc && ogDesc.attr.content ) || null
}

function getFavicon( root, uri ) {
  var html = firstChild( root, 'html' )
  var head = firstChild( html, 'head' )
  var favicon = findChild( head, ( node ) => {
    return node.name == 'link' && node.attr.href && (
      node.attr.rel == 'shortcut icon' ||
      node.attr.rel == 'icon'
    )
  })
  return favicon && {
    href: url.resolve( uri, favicon.attr.href ),
    type: favicon.attr.type || null,
  }
}

// <meta name="msapplication-TileColor" content="#cb3837">
// <meta name="theme-color" content="#cb3837">
function getColor( root ) {
  var html = firstChild( root, 'html' )
  var head = firstChild( html, 'head' )
  var themeColor = findChild( head, ( node ) => {
    return node.name == 'meta' && (
      node.attr.name == 'theme-color' ||
      node.attr.name == 'msapplication-TileColor'
    )
  })
  return themeColor && themeColor.attr.content || null
}

function getTouchIcons( root, uri ) {
  var html = firstChild( root, 'html' )
  var head = firstChild( html, 'head' )
  var icons = findChildren( head, ( node ) => {
    return node.name == 'link' && node.attr.href &&
      (node.attr.rel == 'apple-touch-icon' || node.attr.rel == 'apple-touch-icon-precomposed')
  })
  return icons.map(( node ) => {
    return {
      href: url.resolve( uri, node.attr.href ),
      size: node.attr.sizes && node.attr.sizes.split( 'x' ).map( n => +n ) || null,
      type: node.attr.type || null,
    }
  })
}

// <meta property="og:image" content="https://www.npmjs.com/static/images/touch-icons/open-graph.png">
function getOpenGraphImages( root, uri ) {

  var html = firstChild( root, 'html' )
  var head = firstChild( html, 'head' )
  var graphTags = findChildren( head, ( node ) => {
    return node.name == 'meta' && /^og:image/.test( node.attr.property )
  })

  var images = []
  var image = null
  var node = null

  for( var i = 0; i < graphTags.length; i++ ) {
    node = graphTags[i]
    switch( node.attr.property ) {
      case 'og:image': {
        if( image && image.href ) images.push( image )
        image = { href: node.attr.content && url.resolve( uri, node.attr.content ) }
      } break
      case 'og:image:type': image.type = node.attr.content; break
      case 'og:image:width': image.width = +node.attr.content; break
      case 'og:image:height': image.height = +node.attr.content; break
    }
  }

  if( image && image.href ) images.push( image )

  return images

}

// <meta name="twitter:image" content="https://www.zap-map.com/engine/wp-content/uploads/2014/06/zap-map-grey-c16114d3.png" />
function getTwitterImage( root, uri ) {

  var html = firstChild( root, 'html' )
  var head = firstChild( html, 'head' )
  var twitterTags = findChildren( head, ( node ) => {
    return node.name == 'meta' && /^twitter:image/.test( node.attr.name )
  })

  var image = null
  var node = null

  for( var i = 0; i < twitterTags.length; i++ ) {
    node = twitterTags[i]
    switch( node.attr.name ) {
      case 'twitter:image': {
        image = { href: node.attr.content && url.resolve( uri, node.attr.content ) }
      } break
    }
  }

  return image

}

// <link rel="mask-icon" href="https://assets-cdn.github.com/pinned-octocat.svg" color="#4078c0">
function getMaskIcon( root, uri ) {
  var html = firstChild( root, 'html' )
  var head = firstChild( html, 'head' )
  var icon = findChild( head, ( node ) => {
    return node.name == 'link' && node.attr.href &&
      node.attr.rel == 'mask-icon'
  })
  return icon && {
    href: url.resolve( uri, icon.attr.href ),
    color: icon.attr.color || null,
  }
}

// <link rel="fluid-icon" href="https://github.com/fluidicon.png" title="GitHub">
function getFluidIcon( root, uri ) {
  var html = firstChild( root, 'html' )
  var head = firstChild( html, 'head' )
  var icon = findChild( head, ( node ) => {
    return node.name == 'link' && node.attr.href &&
      node.attr.rel == 'fluid-icon'
  })
  return icon && {
    href: url.resolve( uri, icon.attr.href ),
    title: icon.attr.title || null,
  }
}

// <a href="https://www.salesforce.com/se/" class="logo"><img alt="Salesforce" src="//www.salesforce.com/content/dam/sfdc-docs/www/logos/logo-salesforce.svg"></a>
function getPageIcon( root, uri ) {
  var html = firstChild( root, 'html' )
  var body = firstChild( html, 'body' )
  var link = findChild( body, ( node ) => {
    return node.name == 'a' && node.attr.href &&
      node.attr.class.indexOf('logo') > -1
  })
  var icon = firstChild( link, ( node ) => {
    return node.attr.href && node.attr.href.indexOf('//') !== -1
  })
  return icon && {
    href: url.resolve( uri, icon.attr.href ),
    title: icon.attr.title || icon.attr.alt || null,
  }
}

function inspect( uri, callback ) {

  request({
    url: uri,
    followAllRedirects: true,
    headers: { 
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.150 Safari/537.36',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9'
    },
  }, ( error, res ) => {

    if( error || res.statusCode !== 200 ) {
      res && res.resume()
      error = error || new Error( `HTTP ${res.statusCode} ${res.statusMessage}` )
      return void callback( error )
    }

    res.setEncoding( 'utf8' )

    var handler = new DOMHandler()
    var parser = new html.Parser( handler, {
      xmlMode: false,
      decodeEntities: true,
      lowerCaseTags: true,
      lowerCaseAttributeNames: true,
      recognizeCDATA: true,
      recognizeSelfClosing: true,
    })

    res.on( 'readable', function() {
      var chunk = null
      while( chunk = this.read() ) {
        parser.write( chunk )
      }
    })

    res.on( 'end', function() {
      parser.end()
      var document = handler.document
      var info = {
        name: getName( document ),
        title: getTitle( document ),
        description: getDescription( document ),
        icon: getFavicon( document, uri ),
        themeColor: getColor( document ),
        touchIcons: getTouchIcons( document, uri ),
        openGraph: getOpenGraphImages( document, uri ),
        twitterImage: getTwitterImage( document, uri ),
        maskIcon: getMaskIcon( document, uri ),
        fluidIcon: getFluidIcon( document, uri ),
        pageIcon: getPageIcon( document, uri ),
      }
      parser.parseComplete()
      callback( null, info )
    })

  })

}

module.exports = inspect
