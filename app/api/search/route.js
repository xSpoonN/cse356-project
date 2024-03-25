import { NextResponse } from 'next/server';
import { connect_db } from '../../lib/db.js';

/*  All Tables:
    { table_name: 'spatial_ref_sys' },
    { table_name: 'geography_columns' },
    { table_name: 'geometry_columns' },
    { table_name: 'icesheet_outlines' },
    { table_name: 'water_polygons' },
    { table_name: 'planet_osm_nodes' },
    { table_name: 'planet_osm_ways' },
    { table_name: 'planet_osm_rels' },
    { table_name: 'planet_osm_point' },
    { table_name: 'planet_osm_line' },
    { table_name: 'ne_110m_admin_0_boundary_lines_land' },
    { table_name: 'planet_osm_polygon' },
    { table_name: 'external_data' },
    { table_name: 'icesheet_polygons' },
    { table_name: 'planet_osm_roads' },
    { table_name: 'simplified_water_polygons' } */

// planet_osm_point Seems to be houses and landmarks and shops etc.
// Relevant fields: addr:housename, addr:housenumber, tags. - Tags has a bunch of other addr fields that aren't columns for some reason
// "addr:city"=>"Peconic", "addr:state"=>"NY", "addr:street"=>"Mill Lane", "addr:postcode"=>"11958", "nysgissam:review"=>"existing element's addr:postcode has different addr:postcode", "nysgissam:nysaddresspointid"=>"SUFF209932"
// Need to figure out what the nysgissam stuff means and if we need to change anything.

const Queries = {
  TABLENAMES:
    "SELECT table_name FROM information_schema.tables\
               WHERE table_schema='public'",
  GEOGRAPHY: 'SELECT * FROM geography_columns', // This one is empty lol
  GEOMETRY: 'SELECT * FROM geometry_columns', // Map geometry, probably not useful
  POINTS: "SELECT * FROM 'planet_osm_point' LIMIT 100;",
  TEST: "SELECT * FROM planet_osm_point\
         WHERE tags->'addr:street' LIKE '%Circle Road%'\
         AND tags->'addr:city' = 'Stony Brook'\
         LIMIT 1000",
  SEARCH:
    "SELECT * FROM planet_osm_point\
           WHERE LOWER(tags->'addr:street') LIKE LOWER('%$1%')\
           OR LOWER(tags->'addr:city') LIKE LOWER('%$1%')\
           LIMIT 1000",
};

export async function POST(request) {
  const { bbox, onlyInBox, searchTerm } = await request.json();
  console.log(
    `POST /search: ${JSON.stringify({ bbox, onlyInBox, searchTerm })}`
  );

  const client = await connect_db();
  const sql = Queries.SEARCH.replace(/\$1/g, searchTerm);
  console.log(sql);

  try {
    const res = await client.query(sql);
    console.log(`${res.rows.length} rows returned`);
    client.release();
    return NextResponse.json(res.rows);
  } catch (err) {
    console.error(err);
    client.release();
    return NextResponse.error(err);
  }
}
