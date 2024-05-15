import Head from 'next/head'
import Link from 'next/link';
import clientPromise from '../lib/mongodb.js';

const url = process.env.URL

export const getServerSideProps = async () => {
  try {
    const client = await clientPromise;
    const db = client.db("Codes");

    const codes = await db
      .collection("Solutions")
      .find().toArray();
    return {
      props: {codes : JSON.parse(JSON.stringify(codes))}
    };
  } catch(e) {
      console.error(e);
  }
}

export default function Home({codes}) {
  return (
    <div>
      <Head>
        <title>Collaborative Code Editor</title>
      </Head>
      <div>
        <h1>Choose code block</h1>
        {codes.map(key => (
          <div key={key.title}>
            <Link href={"/" + key.title}>
              <button>{ key.title}</button>
            </Link>
          </div>
        ))}
      </div> 
    </div>
  );
}