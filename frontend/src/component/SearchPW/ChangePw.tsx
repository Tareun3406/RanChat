import React, {useEffect, useState} from "react";
import queryString from "query-string";
import {useNavigate} from "react-router-dom";
import CsrfToken from "../util/CsrfToken";

const ChangePw = ()=>{
    const navigate = useNavigate();
    const [csrf, setCsrf] = useState<string>("");

    const exp = /^[a-zA-Z0-9~!@#$%^&*()]{8,32}$/
    const [pwValue, setPwValue] = useState("");
    const [pwCheckValue, setPwCheckValue] = useState("");

    const [cssPwIsValid, setCssPwIsValid] = useState("");
    const [cssPwCheckIsValid, setCssPwCheckIsValid] = useState("");

    const [pwBlankDivCss, setPwBlankDivCss] = useState({height:"1.75rem"});
    const [pwCheckBlankDivCss, setPwCheckBlankDivCss] = useState({height:"1.75rem"});

    const [isValidPwInput, setIsValidPwInput] = useState<boolean>(false);
    const [isValidPwCheck, setIsValidPwCheck] = useState<boolean>(false);

    const [responseMsg, setResponseMsg] = useState<string>("");
    const query = queryString.parse(window.location.search);

    useEffect(()=>{
        if(pwValue !== ""){
            if (exp.test(pwValue)) {
                setCssPwIsValid("is-valid");
                setIsValidPwInput(true);
                setPwBlankDivCss({height: "0"});
            }
            else {
                setCssPwIsValid("is-invalid");
                setIsValidPwInput(false);
                setPwBlankDivCss({height: "0"});

            }
        }else{
            setCssPwIsValid("");
            setIsValidPwInput(false);
            setPwBlankDivCss({height: "1.75rem"});
        }
    },[pwValue])

    useEffect(()=>{
        if(pwCheckValue !== ""){
            if (pwValue === pwCheckValue && pwCheckValue !== "") {
                setCssPwCheckIsValid("is-valid");
                setPwCheckBlankDivCss({height: "0"});
                setIsValidPwCheck(true);
            }
            else {
                setCssPwCheckIsValid("is-invalid");
                setPwCheckBlankDivCss({height: "0"});
                setIsValidPwCheck(false);
            }
        }else {
            setCssPwCheckIsValid("");
            setPwCheckBlankDivCss({height: "1.75rem"});
            setIsValidPwCheck(false);
        }
    },[pwValue,pwCheckValue])

    useEffect(()=>{
        CsrfToken(setCsrf)
    },[])

    const onClick = ()=>{
        if (isValidPwCheck && isValidPwInput){
            setResponseMsg("????????? ????????? ???????????? ????????????...")
            fetch("/changePw",{
                method:"PATCH",
                headers: {
                    'X-CSRF-Token': csrf,
                    'Content-Type': 'application/json'
                },
                body:JSON.stringify({username : query.username, uid:query.uid, password:pwValue})
            }).then((response)=>{
                if(response.status === 200){
                    navigate("/LoginForm");
                }else
                    setResponseMsg("?????? ????????? ?????????????????????. ???????????? ????????? ???????????? ?????? ????????? ?????????.");
            })
        }else
            setResponseMsg("?????? ????????? ?????? ????????? ?????????")
    }
    return(
        <>
            <div style={{width:"20rem"}}>
                <label className="form-label mt-1 text-start" htmlFor="pwForm" style={{fontSize:"1.2rem"}}>????????????</label>
                <input type="password" name="password" placeholder="8~32?????? ??????,??????,??????" className={"form-control "+cssPwIsValid} id="pwForm"
                       value={pwValue} onChange={(event)=>{setPwValue(event.target.value)}} />
                <div className="invalid-feedback" style={{fontSize:"1rem"}}>????????? ??? ?????? ???????????? ?????????.</div>
                <div className="valid-feedback"  style={{fontSize:"1rem"}}>??????????????? ???????????? ?????????.</div>
                <div style={pwBlankDivCss}/>
            </div>

            <div style={{width:"20rem"}}>
                <label className="form-label mt-1 text-start" htmlFor="pwCheckForm" style={{fontSize:"1.2rem"}}>???????????? ??????</label>
                <input type="password" name="pwCheck" placeholder="??????????????? ?????? ??????????????????." className={"form-control "+cssPwCheckIsValid} id="pwCheckForm"
                       value={pwCheckValue} onChange={(event)=>{setPwCheckValue(event.target.value)}}/>
                <div className="invalid-feedback" style={{fontSize:"1rem"}}>??????????????? ???????????? ????????????.</div>
                <div className="valid-feedback"  style={{fontSize:"1rem"}}>??????????????? ???????????????.</div>
                <div style={pwCheckBlankDivCss}/>
            </div>
            <div>
                <button type="button" className="btn btn-sm" onClick={onClick}>???????????? ????????????</button>
                <div>
                    {responseMsg}
                </div>
            </div>
        </>
    )
}

export default ChangePw;