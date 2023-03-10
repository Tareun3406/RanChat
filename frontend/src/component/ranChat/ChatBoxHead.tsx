import React, {FC} from "react";

interface MemberInfo{
    memberNameMap: Map<string,string>|undefined;
    memberStatusMap: Map<string,boolean>|undefined;
    userId: any;
}
const ChatBoxHead: FC<MemberInfo> = (memberInfo)=>{

    if(memberInfo.memberNameMap !== undefined){
        for (let member of memberInfo.memberNameMap.keys()){
            if(member !== memberInfo.userId && memberInfo.memberStatusMap?.get(member) === true){
                return(<h4  className="card-header" style={{color:'#4ab0d0'}}>{memberInfo.memberNameMap.get(member)} 님과 대화 중</h4>)
            }
            else if(memberInfo.memberStatusMap?.get(member) === false){
                return (<h4 className="card-header" style={{color:'#4ab0d0'}}>대화가 종료 되었습니다.</h4>)
            }
        }
    }

    return(<h4 className="card-header">대화 상대를 기다리는 중...</h4>);
}

export default ChatBoxHead;