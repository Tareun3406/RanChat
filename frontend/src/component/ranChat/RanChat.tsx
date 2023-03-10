import React, {ChangeEvent, FC, useEffect, useRef, useState} from "react";
import Sock from 'sockjs-client';
import {Client, IStompSocket} from "@stomp/stompjs";
import useDidMountEffect from '../util/useDidMountEffect';
import MessageContainer from "./MessageContainer";
import GetUserId from "../util/GetUserId";
import ChatBoxHead from "./ChatBoxHead";

class MessageVO{
    roomId;
    message;
    writer;
    type;
    constructor(roomId: string, message: string, writer: string, type: string) {
        this.roomId = roomId;
        this.message = message;
        this.writer = writer;
        this.type = type;
    }
}
class RoomInfo{
    roomId;
    memberNameMap;
    memberStatus: Map<string, boolean> | undefined;
    constructor(roomId: string, memberNameMap: string|undefined, memberStatus: string|undefined) {
        this.roomId = roomId;
        if(memberNameMap !== undefined && memberStatus !== undefined){
            this.memberNameMap = new Map(Object.entries(memberNameMap));
            // @ts-ignore
            this.memberStatus = new Map(Object.entries(memberStatus));
        }
    }
}

const RanChat: FC = () => {
    const [roomInfo, setRoomInfo] = useState<RoomInfo>();
    const [userId,setUserId] = GetUserId();
    const [messageLog, setMessageLog] = useState<MessageVO[]>();
    const [received, setReceived] = useState<MessageVO>();
    const [messageInputText, setMessageInputText] = useState("");
    const [onSend, setOnSend] = useState(true);


    const bottom = useRef<HTMLDivElement>(null);
    const isBottomMessage = useRef(true);
    const messageContainer = useRef<HTMLDivElement>(null);
    const innerHeight = messageContainer.current?.offsetHeight;

    const onScrollEvent = ()=>{
        const scrollTop = messageContainer.current?.scrollTop;
        if (scrollTop !== undefined && innerHeight !== undefined){
            isBottomMessage.current = scrollTop + innerHeight === messageContainer.current?.scrollHeight;
        }
    };
    useEffect(()=>{
        if(isBottomMessage)
            bottom.current?.scrollIntoView();
    })


    // ????????? ????????? ????????? ??????.(????????????, ?????? ????????? ??????)
    const onBeforeUnload = ()=>{
        client.current.publish({
            destination:'/publish/chat/out',
            body:JSON.stringify({roomId: roomInfo?.roomId, message:"?????? ?????????????????????." , writer:userId, type:"memberOut"})
        });
        client.current.deactivate().then(); // ?????? ??????
        window.removeEventListener("beforeunload", onBeforeUnload); // ????????? ????????? ??????.(????????? ?????? ??????)
        window.removeEventListener("popstate",onBeforeUnload);
    }
    // ????????? ????????? ??????
    const sendOnKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>)=>{
        if (event.shiftKey) return;
        if(event.key==="Enter"){
            if (!event.nativeEvent.isComposing){
                send();
            }
        }
        return;
    }
    const send = ()=>{
        const sendText = messageInputText.trim();
        if(sendText !== ""){
            client.current.publish({
                destination:'/publish/chat/message',
                body:JSON.stringify({roomId: roomInfo?.roomId, message: sendText , writer:userId, type:"message"})
            });
        }
        if (onSend === true)
            setOnSend(false);
        else
            setOnSend(true);
        setMessageInputText("");
    };
    const onChangeMessage= (event: ChangeEvent<HTMLTextAreaElement>)=>{
        const trimedText = event.target.value.trim();
        if (trimedText !== "")
            setMessageInputText(event.target.value);
        else
            setMessageInputText("");
    }

    // Stomp ??????????????? ??????
    const client = useRef(new Client({
        webSocketFactory: ()=>{
            return new Sock('http://ranchat.kr:8080/ranChatWs') as IStompSocket;
        },
        // debug: function (str) {
        //     console.log(str);
        // },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000
    }))
    // ?????? ?????????(activate()) ????????? roomID??? ???????????? ??????.
    client.current.onConnect= ()=>{
        client.current.subscribe('/subscript/chat/room/'+roomInfo?.roomId, (chat)=>{ // ????????? ?????? ????????? ????????? ????????? ????????????
            const content = JSON.parse(chat.body);
            setReceived(content);
        });
        client.current.publish({
            destination:'/publish/chat/join',
            body:JSON.stringify({roomId: roomInfo?.roomId, message:"?????? ?????????????????????." , writer:userId, type:"memberIn"})
        });
    };


    // mount ????????? ?????? ??????. WebSocket ????????? ????????? ????????? ??????
    useEffect(()=>{
        fetch("matchRanChat")
            .then((response) => {
                return response.json();
            })
            .then((json) =>{
                setRoomInfo(new RoomInfo(json.roomId, undefined, undefined));
            })
            .catch((error) => console.log("error: ", error));
    },[]);
    // ??? ?????? ????????? ??? ??????. WebSocket ?????? ??????
    useDidMountEffect(()=>{
        client.current.activate()
        window.addEventListener("beforeunload", onBeforeUnload);
        window.addEventListener("popstate",onBeforeUnload);
    },[roomInfo?.roomId]);
    // ????????? ????????? log ??????
    useEffect(()=> {
        if (received !== undefined) {
            if(received.type === "memberIn" || received.type === "memberOut"){
                fetch("getRoomInfo?roomId="+roomInfo?.roomId)// ?????? ???????????? ?????? ????????????(????????? ?????? ??????)
                    .then((response) => {
                        return response.json();
                    })
                    .then((json) =>{
                        setRoomInfo(new RoomInfo(json.roomId,json.membersName,json.membersIsOnLine));
                    })
                    .catch((error) => console.log("error: ", error));
            }
            if(messageLog === undefined) setMessageLog([received]);
            else setMessageLog([...messageLog, received]);
        }
    },[received]);

    return (
        <div style={{height:"-moz-max-content"}}>
            <div className="card mb-3">
                <ChatBoxHead memberNameMap={roomInfo?.memberNameMap} userId={userId} memberStatusMap={roomInfo?.memberStatus}/>

                <div className="card-body" style={{overflowY:"scroll", height:"55vh", minHeight:"20rem"}} ref={messageContainer} onScroll={(event) => onScrollEvent()}>
                    <MessageContainer messages={messageLog} userId={userId} memberNameMap={roomInfo?.memberNameMap} memberStatusMap={roomInfo?.memberStatus}/>
                    <div ref={bottom} style={{clear:"both"}}/>
                </div>


                <ul className="list-group">
                    <li className="list-group-item">
                        <label htmlFor="exampleTextarea" className="form-label mt-1">???????????? ?????? ?????? ???????????? ??????????????? ????????? ???????????? ???????????????.</label>
                        <div className="form-group">
                            <textarea className="form-control" id="exampleTextarea" rows={3}
                                      onKeyDown={(event)=>{sendOnKeyDown(event);}}
                                      onChange={(event)=>{onChangeMessage(event);}}
                                      value={messageInputText}></textarea>
                        </div>
                    </li>
                </ul>
                <div className="card-footer pt-0">
                    <button type="button" className="btn btn-primary btn-sm" style={{float:"right", marginRight:"1rem"}} onClick={send}>?????????</button>
                </div>
            </div>
        </div>
    );
};

export default RanChat;