import React from 'react';
import {withRouter} from 'react-router-dom';
import ImageUtils from '../../components/Utils/ImageUtils/ImageUtils';
import LocalizedStrings from "react-localization";
import { localizedStrings } from '../../language/localizedStrings';import './feedback.scss';
import SeeFeedbackModal from './SeeFeedbackModal';
import GiveFeedbackModal from './GiveFeedbackModal';
import ReqFeedbackModal from './ReqFeedbackModal';
import { getPastRelativeTime, TruncateWithDynamicLen } from '../../constants/constants';
import InfiniteScroll from 'react-infinite-scroller';
import moment from 'moment';
import Anonymous from '../../assets/images/Anonymous-Icon.svg';


class FeedbackComp extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            language: "en",
            showSeeFeedbackPopup: false,
            showGiveFeedbackPopup: false,
            showReqFeedbackPopup: false,
            prefilledData: ''
        }
    }
    btnClick(prefilledData){
        if(prefilledData.Status === 0 ){
            this.setState({showGiveFeedbackPopup: true});
            this.setState({prefilledData: prefilledData});
        } else if(prefilledData.Status === 1){
            this.setState({showSeeFeedbackPopup: true, prefilledData: prefilledData});
        }
    }
    closeSeeFeedbackModal() {
        this.setState({ showSeeFeedbackPopup: false });
    }
    closeGiveFeedbackModal() {
        this.setState({ showGiveFeedbackPopup: false });
    }
    closeReqFeedbackModal() {
        this.setState({ showReqFeedbackPopup: false });
    }
    loadFunc(){
        setTimeout(async () => {
          await this.props.apiCall((this.props.currentPageNum)+1,10);
        }, 2000)
    }
    renderFeeedbackComp(){
        const { requestedFlag, feedbackData, givenFlag} = this.props;
        let strings = new LocalizedStrings(localizedStrings);
        strings.setLanguage(this.state.language);
        return(
            <InfiniteScroll
                    loadMore={this.loadFunc.bind(this)}
                    hasMore={this.props.hasMore}
                    initialLoad={false}
                    loader={<div className="loader text-center" key={0}>Loading ...</div>}
                >
                {feedbackData.length > 0 && feedbackData.map(eachFeedback=>
                    <div>
                        <p className="text_grey small font-weight-bold my-3">{moment(eachFeedback.date).format('DD MMM YYYY')}</p>
                        {eachFeedback.feedback.length> 0 && eachFeedback.feedback.map(item=>
                            <div className="app-card mb-3">
                                    <div className="row">
                                        <div className="col-md-5 col-lg-6 d-grid">
                                            <div className="d-flex align-items-center">
                                            <ImageUtils src={ item.RequesterProfile != null ? item.RequesterProfile.ImageUrl: Anonymous} 
                                                            name={item.RequesterProfile !== null ? item.RequesterProfile.FullName : strings.feedback.anonymous} 
                                                            width={42} className="rounded-circle" />
                                            <div className="d-xs-block d-sm-flex d-md-flex d-lg-flex ml-2">
                                                <p className="small font-weight-bold text-gray mt-2">
                                                    <span className="text-black small font-weight-bold">{item.RequesterProfile != null ? item.RequesterProfile.FullName : strings.feedback.anonymous}</span>
                                                    {item.RequesterProfile !== null ?    item.Status == 0 && !requestedFlag ? " " + strings.feedback.reqFeedbackMsg +" " + getPastRelativeTime(item.CreatedDate)+".":
                                                    (item.Status == 1 && !givenFlag) ? " " + strings.feedback.sentFeedbackMsg +" " + getPastRelativeTime(item.JobCriteria.length> 0 && item.JobCriteria[0].GivenDate)+"." :
                                                    (item.Status == 1 && givenFlag) ? " " + strings.feedback.receivedFeedbackMsg +" " + getPastRelativeTime(item.JobCriteria.length> 0 && item.JobCriteria[0].GivenDate)+"." :
                                                    (item.Status == 0 && requestedFlag) && " " + strings.feedback.receivedReqMsg +" " + getPastRelativeTime(item.CreatedDate)+"."
                                                    : " "+strings.feedback.anonymousFeedback +" " + getPastRelativeTime(item.CreatedDate)+"."}</p>
                                            </div>
                                            </div>
                                        </div>
                                        <div className="col-md-5 col-lg-4">
                                            <div>
                                            {item.JobCriteria.length >0 && item.JobCriteria.map(eachJob=>
                                                item.Status === 1 ?
                                                    <p className="mr-4 my-2">
                                                    <span className={ eachJob.Rating < 2.99 || eachJob.Rating === 2.99 ? "app-blue-badge-pill bg-light-red text-red small":
                                                                    eachJob.Rating < 3.99 || eachJob.Rating === 3.99 ? "app-blue-badge-pill bg-light-orange text-orange small" :
                                                                    "app-blue-badge-pill bg-light-green text-green small"}>
                                                        <div className="d-flex">
                                                            {eachJob.Rating.toFixed(2)} <i class="fa fa-star mr-1" aria-hidden="true"></i>
                                                            <p>{TruncateWithDynamicLen(eachJob.Title, 30)}</p>
                                                        </div>  
                                                    </span></p> : 
                                                    <p className="mr-4 my-2">
                                                        <span className={"app-blue-badge-pill small"}> 
                                                            <div className="d-flex">
                                                                <i class="fa fa-star mr-1" aria-hidden="true"></i>
                                                                <p>{TruncateWithDynamicLen(eachJob.Title, 30)}</p>
                                                            </div>
                                                        </span></p>
                                            )}
                                            </div>
                                        </div>
                                        <div className="col-md-2 col-lg-2 d-flex justify-content-center">
                                            <div className="d-flex align-items-center mt-1 mt-lg-0 mt-md-0 mt-dm-0">
                                            <button className={ item.Status == 0 && !requestedFlag ? "font-weight-bold small border-0 bg-primary text-white py-2 px-3" :
                                                                item.Status === 1 ? "app-blue-badge-pill border-0 py-2": 
                                                                item.Status == 0 && requestedFlag && "app-blue-badge-pill border-0 py-2 bg-light-orange text-orange"}
                                                    disabled ={item.Status == 0 && requestedFlag ? true : false}
                                                    onClick={() => this.btnClick(item)} 
                                                    style={{outline: 'none', borderRadius: 5}}>
                                                {   item.Status == 0 && !requestedFlag ? strings.feedback.giveFeedback : 
                                                    item.Status == 1 ? strings.feedback.seeFeedback :
                                                    requestedFlag && strings.feedback.request}</button>
                                            </div>
                                        </div>
                                    </div>
                            </div>)}
                    </div>)}
           </InfiniteScroll>
        )
    }
    render() {
        const {showSeeFeedbackPopup, showGiveFeedbackPopup, showReqFeedbackPopup, prefilledData } = this.state;
        return (
            <React.Fragment>
                {this.renderFeeedbackComp()}
                {showSeeFeedbackPopup && 
                <SeeFeedbackModal   closeModal={this.closeSeeFeedbackModal.bind(this)} 
                                    show={this.state.showSeeFeedbackPopup}
                                    prefilledData={prefilledData}
                                    received={this.props.received}/>}
                {showGiveFeedbackPopup && 
                <GiveFeedbackModal  closeModal={this.closeGiveFeedbackModal.bind(this)} 
                                    show={this.state.showGiveFeedbackPopup} 
                                    requestFromMem={true}
                                    fromGiven={false}   
                                    prefilledData={prefilledData}
                                    getUpdatedReqAPI={this.props.apiCall}/>}
                {showReqFeedbackPopup && 
                <ReqFeedbackModal   closeModal={this.closeReqFeedbackModal.bind(this)} 
                                    show={this.state.showReqFeedbackPopup} 
                                    ifManager={this.state.ifManager}/>}
            </React.Fragment>
        )
    }
}

export default withRouter(FeedbackComp);
