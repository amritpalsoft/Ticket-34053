import React from 'react';
import Interweave from 'interweave';
import { withRouter } from 'react-router';
import { withTranslation } from 'react-i18next';
import {GetUserMentions, EmailExistsinString} from './CustomMatch';

const hashtag_match = /(^|\s)(#[\u00C0-\u1FFF\u2C00-\uD7FF\w]+)/ig;
const exp_match = /(\b(https?|):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
const new_exp_match =/(^|[^\/])(www\.[\S]+(\b|$))/gim;
const exp_match_testing =/(^|[^\/])(https[\S]+(\b|$))/gim;
const exp_tag_match =/(^|[^\/])(@{[\S]+(\b|$))/gim;

class TextFormat extends React.Component{
    
    onUserProfileNavigation = (name, users) => {
        let targeUser = users.find(el => (el.name && el.name.toLowerCase()) === name.toLowerCase());
        this.props.history.push('/profile', {
            email: targeUser.email
        })
    }

    transformText = (node, children, type, spaces, userData) => {
        if(type === "post") {
            if(spaces) {
                if (node.tagName.toLowerCase() === "span"  && children && children[0] && typeof(children[0]) !== 'object') {
                    if(children[0].startsWith('@')) {
                        return  <span className="text-info pointer" 
                                    onClick={() => this.onUserProfileNavigation(children[0].slice(1), userData)}>
                                    {children[0].slice(1)}
                                </span>
                    } else if((children[0].match(exp_match) || children[0].match(new_exp_match))) {
                        return  <span onClick={() => window.open(children[0].match(new_exp_match) ? "https://"+children[0] :children[0])} 
                                    style={{wordBreak: "break-word"}} className="text-info pointer">
                                    {children}
                                </span>
                    } else if(children[0].startsWith('#')) {
                            let spaceObj=spaces.find(space => space.Name.toLowerCase() === children[0].slice(1).toLowerCase());
                        return  <span onClick={() => {
                                        const {history, setView}=this.props;
                                        if(spaceObj) {
                                            history.push('/feed?hash='+ children[0].slice(1) + '&spaceId=' + spaceObj.Id);
                                            setView && setView(spaceObj.Id);
                                        }
                                    }} 
                                    style={{wordBreak: "break-word"}} className="text-info pointer">
                                    {children[0]}
                                </span>
                    }
                }
            } else {
                return <span className="">{children}</span>
            }
        } else if(type === "comment" || type === "reply") {
            if(children && children[0] && children[0].startsWith('@')) {
                return <span className="text-info pointer" 
                            onClick={() => this.onUserProfileNavigation(children[0].slice(1), userData)}>
                            {children[0].slice(1)}
                        </span>
            } else {
                return <span style={{display:'grid'}} className="">{children}</span>
            }
        } else {
            return <span className="">{children}</span>
        } 
    }    

    getLastIndex(receivedString, renderTxt){
        if(receivedString && receivedString != null && receivedString != "" && receivedString != undefined){
            let existFlag = JSON.stringify(receivedString).includes("...");
            if(existFlag){
                let lastindex = renderTxt.indexOf(receivedString);
                return lastindex;
            }else {
                return null;
            }
        }else{
            return null;
        }        
    }

    renderTextContent(content, id, showChar, seeMoreIndx, type, spaces) {
        if(content) {
        let renderTxt;
        let visibleTxt = content.substr(0, showChar);
        let hiddenTxt = content.substr(showChar, content.length - showChar);
        let ellipsestext = "...";
        if(content.length > showChar) {
            renderTxt=seeMoreIndx.includes(id) ? visibleTxt + hiddenTxt : visibleTxt + ellipsestext;
            if(!seeMoreIndx.includes(id)){
                let found = renderTxt.match(exp_match_testing);   // https
                let secondFound = renderTxt.match(new_exp_match);  //www
                let foundlastIndex = this.getLastIndex(found, renderTxt);
                let secondFoundlastIndex = this.getLastIndex(secondFound, renderTxt);
                if(foundlastIndex && foundlastIndex != null && foundlastIndex != ""){
                    renderTxt = renderTxt.substr(0, foundlastIndex);
                }
                if(secondFoundlastIndex && secondFoundlastIndex != null && secondFoundlastIndex != ""){
                    renderTxt = renderTxt.substr(0, secondFoundlastIndex);
                }                 
                let tagFound = renderTxt.match(exp_tag_match);
                if(tagFound && tagFound != null && tagFound != "" && tagFound != undefined){                
                    let existFlag = JSON.stringify(tagFound).includes("...");
                    if(existFlag){                    
                        let startIndex = renderTxt.indexOf(tagFound);                                             
                        renderTxt = renderTxt.substr(0, startIndex);
                    }
                }
            }
        } else {
            renderTxt=visibleTxt + hiddenTxt;
        }
        let formatTxt=renderTxt;
        let stSplit = formatTxt.split('@{');
        let finaldata = '';
        stSplit.forEach((output, index) => {
            let twosplit = output.split('}');
            twosplit.forEach((sec, secindex)=>{
                let email_exists=EmailExistsinString(sec);
                let newStr;
                if(email_exists) {
                newStr = sec.replace(":", "^^^");
                } else {
                newStr = sec;
                }
                let threesplit = newStr.split('^^^');
                if(threesplit.length === 2) {
                    finaldata = finaldata + '<span>@' + threesplit[0] + '</span>';
                } else {
                    finaldata = finaldata + threesplit[0];
                }
            })
        })
        let hash_content=finaldata.replace(hashtag_match, "$1<span>$2</span>")
        let element_content=hash_content.replace(exp_match, "<span href='$1'>$1</span>");
        let new_content=element_content.replace(new_exp_match, '$1<span target="_blank" href="http://$2">$2</span>');

        return (
            <Interweave 
                content={new_content} 
                transform={(node, children) => 
                    this.transformText(node, children, type, spaces, GetUserMentions(renderTxt))} 
            />
        )
        } else return null;
    }
    
    render() {      
        const {content, id, showChar, seeMoreIndx, type, spaces}=this.props;
        return(
            <div>
                {this.renderTextContent(content, id, showChar, seeMoreIndx, type, spaces)}
            </div>
        )
    }
}

export default withTranslation('translation')(withRouter(TextFormat));
