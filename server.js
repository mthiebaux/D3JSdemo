
const http = require( "http" );
const fs = require( "fs" );
const path = require( "path" );

const port = 8080;

const server = http.createServer(

	( request, response ) => {

		console.log( request.method + ": " + request.url );

		if( request.method === "GET" )	{

			let url = ".";
			if( request.url === "/" )	{
				url += "/index.html"; // default
			}
			else	{
				url += request.url;
			}

			const content_type = {
				".html":	{ 'Content-Type': 'text/html' },
				".json":	{ 'Content-Type': 'application/json' },
				".js":		{ 'Content-Type': 'application/javascript' },
				".mjs":		{ 'Content-Type': 'application/javascript' }
			};

			try {

				const file_data = fs.readFileSync( url );

				response.writeHead( 200, content_type[ path.extname( url ) ] );
				response.write( file_data );
			}
			catch( err ) {
				console.error( err );
				response.write( JSON.stringify( { error: err, msg: "URL NOT RECOGNIZED" }, null, 2 ) );
			}

			response.end();
		}
	} // ( request, response ) => {}
);

server.listen(
	port,
	() => {
		console.log( " ┌───────────────────────────────────┐" );
		console.log( " │                                   │" );
		console.log( " │   Module Server:                  │" );
		console.log( " │                                   │" );
		console.log( " │       http://localhost:" + port + "       │" );
		console.log( " │                                   │" );
		console.log( " └───────────────────────────────────┘" );
	}
);
