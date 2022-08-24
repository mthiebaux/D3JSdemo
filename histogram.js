
import * as d3 from "https://cdn.skypack.dev/d3@7"; // GitHub recommended

export { create };

///////////////////////////////////////////////////////////////////////

function create( view, attr, width, height )	{

	let svg = null;
	let elem_name = view.select( "histo" );
	if( elem_name )	{
		svg = d3.select( elem_name )
			.append( "svg" )
			.attr( "width", width )
			.attr( "height", height );
	}

	let hist = {

		svg,
		attr,

		width,
		height,

		accum: [],
		path: null,

		// export funcs
		update( degrees, num_buckets, reset_history = false ) {
			if( svg )	{
				update_histogram( this, degrees, num_buckets, reset_history );
			}
		}
	};
	return( hist );
}

///////////////////////////////////////////////////////////////////////

function accumulate_bins( bins, accum )	{

	while( accum.length < bins.length ) accum.push( 0 );

	for( let i=0; i< bins.length; i++ )	{
		accum[ i ] += bins[ i ].length;
	}
	return( accum );
}

function update_histogram( hist, degrees, num_buckets, reset_history = false )	{

	if( reset_history )
		hist.accum = [];

	if( hist.path ) hist.path.remove();

	let X_scale = d3.scaleLinear()
		.domain( [ 0, num_buckets + 1 ] )
		.range( [ 0, hist.width ] );

	let histo_bins = d3.bin() // formerly histogram
		.value(
			function( element, index, data ) {
				return element;
			}
		)
		.domain( [ 0, num_buckets + 1 ] )
		.thresholds( num_buckets );

	let bins = histo_bins( degrees );

	let Y_scale = d3.scaleLinear()
		.domain( [ 0, d3.max( bins, (d) => d.length ) ] )
		.range( [ hist.height, 0 ] );

	hist.svg.selectAll( "rect" )
		.data( bins )
		.join( "rect" )
			.attr( "x", 1 )
			.attr( "transform",
				function( d ) {
					return "translate(" + X_scale( d.x0 ) + "," + Y_scale( d.length ) + ")";
				}
			)
			.attr( "width",
				function( d ) {
					if( d.x1 > d.x0 )	{
						return( X_scale( d.x1 ) - X_scale( d.x0 ) - 1 );
					}
					return( 0 );
				}
			)
			.attr( "height",
				function( d ) {
					return( hist.height - Y_scale( d.length ) );
				}
			)
			.attr( "fill",
				d => hist.attr.bin_color( d.length ? d[ 0 ] : 0 )
			);

	hist.accum = accumulate_bins( bins, hist.accum );

	let max = 1; // in case of no data
	for( let i=0; i< hist.accum.length; i++ )	{

		if( max < hist.accum[ i ] ) max = hist.accum[ i ];
	}

	let norm = [];
	for( let i=0; i< hist.accum.length; i++ )	{

		norm.push( [ i, hist.accum[ i ] / max ] );
	}

	hist.path = hist.svg.append( "path" )
        .datum( norm ) // single selection
			.attr( "class", "line" )
			.attr( "d", d3.line()
				.curve( d3.curveLinear )
				.x( d => X_scale( d[ 0 ] + 0.5 ) ) // mid top of bar, zero indexing
				.y( d => hist.height - d[ 1 ] * hist.height )
			)
			.attr( "fill", "none" )
			.attr( "stroke", "#000" )
			.attr( "stroke-dasharray", ( "3, 6" ) )
			.attr( "stroke-width", 3 );
}
