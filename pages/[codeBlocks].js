import { Editor } from "@monaco-editor/react";
import { useEffect, useState, useRef} from "react";
import clientPromise from "../lib/mongodb";
import io from 'socket.io-client';
import Head from "next/head";

const isBrowser = typeof window !== 'undefined';

export const getStaticPaths = async () => {
    try {
    const client = await clientPromise;
    const db = client.db("Codes");

    const res = await db
      .collection("Solutions")
      .find().toArray();
    const data = await res

    const paths = data.map(block => {
        return {
            params: {codeBlocks: block.title.toString()}
        }
    });

    return {
      paths: paths,
      fallback: false
    };
  } catch(e) {
      console.error(e);
  }
}

export const getStaticProps = async (context) => {
    const title = context.params.codeBlocks;
    let data;
    try {
        const client = await clientPromise;
        const db = client.db("Codes");
    
        const res = await db
          .collection("Solutions")
          .findOne({title : {$eq : title}})

        data = res;
    } catch(e) {
        console.error(e);
    }
    return {
        props : {block : {title : data.title, code : "", solution: data.solution}}
    }
}

const codeBlocks = ({block}) => {
    const [isConnected, setIsConnected] = useState(false);
    const [userType, setUserType] = useState("Mentor");
    const [codeBlock, setCodeBlock] = useState(block);
    const [ioSocket, setIOSocket] = useState(null);
    const [smiley, setSmiley] = useState("");

    const editorRef = useRef(null);
    
    useEffect(() => {
        const socket = isBrowser ? io() : {};
        setIOSocket(socket);

        function onConnect() {
            setIsConnected(true);
            socket.emit("roomName", codeBlock.title);
        }

        function onDisconnect() {
            setIsConnected(false);
            socket.disconnect();
        }
        
        if (socket.connected) {
            setIsConnected(true);
        }

        socket.on("connect", onConnect);
        socket.on("disconnect",onDisconnect);

        socket.on("codeEdit", (code) => {
            setCodeBlock((prevState) => ({...prevState,
            code: code
            
            }));
        });

        socket.on("userType", (user) => {
            setUserType(user);
        });

        return () => {
            socket.off("connect", onConnect);
        }
    }, []);
    
    function handleEditorMount(editor) {
        editorRef.current = editor;
        editor.focus();
    }

    function handleEditorChange(value) {
        if (userType == "Student") {
            ioSocket.emit("codeEdit", value, codeBlock.solution, codeBlock.title);
        }
        value == codeBlock.solution ? setSmiley('😊') : setSmiley("");
    }

    return ( 
        <div>
            <Head>
                <title>Collaborative Code Editor | </title>
            </Head>
            <a href={'./'}>
                <button>back</button>
            </a>
            <div className="smiley">{smiley}</div>
            <Editor
                height="90vh"
                defaultLanguage="javascript"
                theme="vs-dark"
                defaultValue={codeBlock.code}
                value={codeBlock.code}
                onChange={handleEditorChange}
                onMount={handleEditorMount}
                options={{readOnly : userType == "Mentor"}}
            />
            
        </div>
        
    );
}
 
export default codeBlocks;