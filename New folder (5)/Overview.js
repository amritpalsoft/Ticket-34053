import React from 'react';
import {withRouter} from 'react-router-dom';
import {Api} from '../../api/Api';
import GetAPIHeader from '../../api/ApiCaller';
import ErrorHandling from '../../api/ErrorHandling';
import LocalizedStrings from "react-localization";
import { localizedStrings } from '../../language/localizedStrings';
import { Button} from 'react-bootstrap';
import FeedbackComp from './FeedbackComp';
import GiveFeedbackModal from './GiveFeedbackModal';
import ReqFeedbackModal from './ReqFeedbackModal';
import ImageUtils from '../../components/Utils/ImageUtils/ImageUtils';
import Modal from 'react-bootstrap/Modal';
import HeaderBanner from '../../components/Banner/headerBanner';
import bannerIcon from '../../assets/images/feedback.svg';
import statistics from '../../assets/images/Statistic_White.svg';
import Filters from './Filters';
import {TruncateWithDynamicLen} from '../../constants/constants';
import Loading from '../../components/Loading/loading';
import AddGoalModal from "../collaborate/goalsetting/AddGoalModal";
import emptyFeedback from '../../assets/images/empty/feedback.svg';
import Empty from "../../components/Utils/Empty/Empty";
import StorageUtils from '../../containers/utils/StorageUtils';
import { AllFeatures } from '../../components/Services/core';
import { getIsEnabled } from '../../constants/constants';
import './Overview.css'

const Storage = new StorageUtils();

class overview extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            language: "en",
            showGiveFeedbackPopup: false,
            showReqFeedbackPopup: false,
            showAllcompetenciesPopup: false,
            ifManager: '',
            doingGoodAtArr: [],
            improveOnArr: [],
            allFeedbacks:[],
            filterVal: 1,
            loading: 0,
            nudgeRating: '',
            nudgeJobCriteria: '',
            nudgeJobCriteriaId: '',
            recentFeedbacks: [],
            last7DaysArr: [],
            pageNumber: 1,
            pageSize: 10,
            hasMore: true,
            showHeaderBanner: true,
            userId: '',
            OpenGoalModal: false,
            showGoalModal: false,
            requestFromMem: false,
            combinedRecentlyArr:[],
            pastReceiveduserId: '',
            fromNudge: false
        }
    }
    componentDidMount(){
        const { headerBanner, user} = this.props;
        let url = window.location.href.substring(window.location.href.indexOf("?")+1);
        if(url === "givefeedback" || url === "givefeedback?host=msteams"){
            this.setState({showGiveFeedbackPopup: true});
        } else if(url === "requestedfeedback" || url === "requestedfeedback?host=msteams"){
            this.setState({showReqFeedbackPopup: true});
        }
        if( headerBanner === false && user !== ''){
            this.setState({showHeaderBanner: false, pastReceiveduserId: user.Subordinates.UserId, userId: user.Subordinates.UserId});
        } else {
            this.setState({showHeaderBanner: TruncateWithDynamicLen});
        }
    }
    giveFeedback() { 
        this.setState({showGiveFeedbackPopup: true, requestFromMem: false});
    }
    reqFeedback(val){
        this.setState({showReqFeedbackPopup: true, ifManager: val});
    }
    dismissNudge(JsfId){
        this.setState({loading: 1});
        new Api(GetAPIHeader(Storage.getAccessToken())).v31.dismissNudge(JsfId)
            .then(response=>{
                if(response){
                    this.props.getFeedbacksNudge(this.props.filterVal)
                    this.setState({loading: 0})
            }
            }).catch((err) => {				ErrorHandling(err)
                this.setState({loading: 0})
            });
    }
    getFeedbacksByJobCriterion(){
        new Api(GetAPIHeader(Storage.getAccessToken())).v31.getFeedbacksByJobCriterion(0)
            .then(response=>{
                if(response.length> 0){
                    this.setState({recentFeedbacks: response});
            }
            }).catch((err) => {				ErrorHandling(err)

            })
    }
    viewAllCompetenciesClick(showPopup){
        this.setState({showAllcompetenciesPopup: showPopup});
    }
    createGoalFromNudge(fromNudge){
        this.setState({showGoalModal: true, OpenGoalModal: true, fromNudge: fromNudge})
    }
    renderOverview(){
        let strings = new LocalizedStrings(localizedStrings);
        strings.setLanguage(this.state.language);
        const { showHeaderBanner} = this.state;
        const {doingGoodAtArr, improveOnArr, allFeedbacks, nudgeResp, managerProfile,
                filterLoading, summaryLoading} = this.props
        return(
            <div>
                            <div className='d-lg-flex d-md-flex d-sm-flex d-block justify-content-end'> <Filters getFilterdVal={this.props.filterValClick.bind(this)} disable={filterLoading}/>
                            </div>
                            <br />
                <div className="app-card">
                    <div>
                        <div className="d-lg-flex d-md-flex d-sm-flex d-block justify-content-between">
                            <p className="small font-weight-bold">{strings.feedback.feedbackSummary}</p>
                        </div>
                        {summaryLoading || filterLoading? 
                        <div className="position-relative"><Loading/></div> : allFeedbacks.length > 0 ?
                            <>
                            <div className="row mt-3">
                                    <div className="col-md-6">
                                        <p className="small font-weight-bold my-3 my-lg-0 my-md-0">{strings.feedback.doingGoodAt}</p>
                                            {doingGoodAtArr.length>0?
                                            <div className="d-flex flex-wrap mt-2 feedbackClass">
                                                {doingGoodAtArr.length> 0 && doingGoodAtArr.map(eachItem=>
                                                    <p className="mr-2 mb-1">
                                                        <span className={(eachItem.AvgRating === 3.99 || eachItem.AvgRating < 3.99) ?
                                                                    "app-blue-badge-pill bg-light-orange text-orange small" : 
                                                                    "app-blue-badge-pill bg-light-green text-green small"}>
                                                            {eachItem.AvgRating.toFixed(2)} <i class="fa fa-star mr-1" aria-hidden="true"></i>
                                                            {TruncateWithDynamicLen(eachItem.JobSuccessFactorLable, 40)}</span></p>
                                                )}
                                            </div>:<div className="d-flex flex-wrap mt-2 feedbackClass"><small  >No feedback given</small> </div>}
                                    </div>
                                    <div className="col-md-6">
                                        <p className="small font-weight-bold mb-md-2 mb-lg-2 mb-3">{strings.feedback.improveOn}</p>
                                        {improveOnArr.length>0?
                                        <div className="d-flex flex-wrap mt-2 feedbackClass">
                                            {improveOnArr.length> 0 && improveOnArr.map(eachItem=>
                                                <p className="mr-2 mb-1">
                                                    <span className={eachItem.AvgRating === 3 ? "app-blue-badge-pill bg-light-orange text-orange small " : 
                                                "app-blue-badge-pill bg-light-red text-red smallsm"}>
                                                {eachItem.AvgRating.toFixed(2)} <i class="fa fa-star mr-1" aria-hidden="true"></i>
                                                {TruncateWithDynamicLen(eachItem.JobSuccessFactorLable, 40)}</span></p>
                                            )}
                                        </div>: <div className="d-flex flex-wrap mt-2 text-grey feedbackClass"> <small >No feedback given</small> </div>}
                                    </div>
                            </div>
                            <p className="mt-4 text-primary small text-center font-weight-bold pointer" 
                                onClick={()=>this.viewAllCompetenciesClick(true)}>View all competencies</p>
                                </>
                                 : 
                             <Empty image={emptyFeedback} text={strings.feedback.emptyOverviewPrimary} secondaryText={strings.feedback.emptyOverviewSecondary}/>
                        }
                        {showHeaderBanner &&
                            managerProfile !== undefined && managerProfile.FullName !== null && managerProfile.FullName !== '' && managerProfile.FullName !== undefined &&
                        <>
                            <p className="small font-weight-bold mt-lg-1 mt-md-1 mt-3">Manager</p>
                            <div className="d-lg-flex d-md-flex d-block mt-2">
                                <div className="d-flex">
                                    <ImageUtils src={managerProfile.ImageUrl} width={30} height={30} name={managerProfile.FullName} className="mr-2 mt-1"/>
                                    <div>
                                        <p className="small font-weight-bold">{managerProfile.FullName}</p>
                                        <p className="small text-gray">{managerProfile.Position}</p>
                                    </div>
                                </div>
                                <Button className="font-weight-bold text-white border-0 mx-3 mt-2 mt-lg-0 mt-md-0 mt-sm-0 small"
                                onClick={()=>window.open("https://teams.microsoft.com/l/chat/0/0?users="+ managerProfile.Email)}>{strings.common.chat}</Button>
                                <Button className="font-weight-bold text-white border-0 mt-2 mt-lg-0 mt-md-0 mt-sm-0 small"
                                onClick={()=> this.reqFeedback(managerProfile)}>{strings.feedback.reqFeedback}</Button>
                            </div>
                        </>
                        }
                    </div>
                </div>
                {getIsEnabled(AllFeatures.FE_GOAL_CREATE_GOAL) && showHeaderBanner &&
                nudgeResp !== '' && nudgeResp.JSFLabel !== null && nudgeResp.JSFLabel !== "" && nudgeResp.JSFLabel !== undefined && nudgeResp.AvgRating < 3 &&
                <div className="d-lg-flex d-md-flex d-sm-flex d-block bg-primary p-3 justify-content-between mt-3 btn-border-radius">
                    <div className="d-flex">
                        <img src={statistics} alt="" className="mr-lg-4 mr-md-4 mr-sm-4 mr-2 ml-lg-4 ml-md-4 ml-sm-4 ml-0" style={{height: '30px'}}/>
                        <div>
                            <p className="small text-white font-weight-bold">{"You've received " + nudgeResp.AvgRating + " average rating on " + nudgeResp.JSFLabel+ "."}</p>
                            <p className="small text-white">Create a goal today!</p>
                        </div>
                    </div>
                    <div className="d-flex justify-content-end">
                        <p className="small mt-2 text-white mr-3 pointer" onClick={()=> this.dismissNudge(this.props.nudgeResp.JobCriteriaId)}>Dismiss</p>
                        <Button className="font-weight-bold bg-white text-primary border-0 small"
                        onClick={()=> this.createGoalFromNudge(true)}>{strings.feedback.createGoal}</Button>
                    </div>
                </div>
                }
                <div className="mt-4">
                    <p className="small font-weight-bold">{strings.feedback.recentltReceived + ' '+ strings.feedback.feedback}</p>
                    {this.props.last7DaysArr !== undefined && this.props.last7DaysArr.length> 0 ?
                    <div className="col-md-12 px-0 mt-4">
                        <FeedbackComp   feedbackData={this.props.last7DaysArr} 
                                        received={this.props.headerBanner === false && 
                                                    this.props.user !== '' ? false: true}
                                        apiCall={this.props.recentlyReceiveFeedbacksByUser}
                                        currentPageNum={this.props.pageNumber}
                                        hasMore= {this.props.hasMore}/>
                    </div> :
                    <Empty image={emptyFeedback} text={strings.feedback.emptyReceivedPrimary} secondaryText={strings.feedback.emptyReceivedSecondary}/>}
                </div>
            </div>
        )
    }
    closeGiveFeedbackModal() {
        this.setState({ showGiveFeedbackPopup: false });
    }
    closeReqFeedbackModal() {
        this.setState({ showReqFeedbackPopup: false });
    }
    renderAllcompetenciesModal(){
        const {showAllcompetenciesPopup} = this.state;
        const {allFeedbacks} = this.props;
        let strings = new LocalizedStrings(localizedStrings);
        strings.setLanguage(this.state.language);
        return(
            <Modal
            dialogClassName="p-4"
            show={showAllcompetenciesPopup}
            size="lg"
            aria-labelledby="contained-modal-title-vcenter"
            className={"FeedbackModal"}
            centered>
            <div>
                <Modal.Body className= "bg-white p-4">
                    <p className="font-weight-bold noemal text-center mb-3">{strings.feedback.allMyCompetencies}</p>
                    <div className="d-flex flex-wrap mt-2 justify-content-center">
                        {allFeedbacks.length> 0 && allFeedbacks.map(eachItem=>
                            <p className="mr-2 mb-2">
                                <span className={eachItem.AvgRating < 3 ?
                                    "app-blue-badge-pill bg-light-red text-red small word-break-badge-pill" : 
                                    ((eachItem.AvgRating > 3.0 && eachItem.AvgRating < 3.99) || eachItem.AvgRating === 3) ?
                                    "app-blue-badge-pill bg-light-orange text-orange small word-break-badge-pill": eachItem.AvgRating > 3.99 &&
                                    "app-blue-badge-pill bg-light-green text-green small word-break-badge-pill"}>
                                    {eachItem.AvgRating.toFixed(2)} <i class="fa fa-star mr-1" aria-hidden="true"></i>
                                    {eachItem.JobSuccessFactorLable}</span></p>
                        )}
                    </div>
                    <div className="text-center">
                        <button className="font-weight-bold small mt-3 bg-primary outline-none btn-border-radius border-0 text-white"
                            style={{width: '100px', height: '30px'}}
                            onClick={()=>this.viewAllCompetenciesClick(false)}>Close</button>
                    </div>
                </Modal.Body>
            </div>
        </Modal>
        )
    }
    render() {
        const {showGiveFeedbackPopup, showReqFeedbackPopup, showAllcompetenciesPopup, showHeaderBanner,
             showGoalModal} = this.state;
        const {managerProfile, urlFromQuest} = this.props;
        let strings = new LocalizedStrings(localizedStrings);
        strings.setLanguage(this.state.language);
        const {user, headerBanner} = this.props;
        const LoggedInUserId = localStorage.getItem('LoggedInUserID');
        const LoggedInUserProfile = Storage.getProfile();;
        return (
            <React.Fragment>
            <div className="container px-0">
                {showHeaderBanner ? 
                <div>
                    <HeaderBanner bannerImg={bannerIcon}
                    bannerHeader={strings.feedback.bannerHeader}
                    bannerDesc={this.props.bannerDesc}
                    bannerBackground={'#FFF6E3'} bannerH4Color={'#FFC542'}
                    showButtons={true}
                    giveFeedbackClick={this.giveFeedback.bind(this)}
                    reqFeedbackClick={()=> this.reqFeedback(false)}
                    />
                </div> :
                <div className="col-md-12 p-0">
                    <div className="d-lg-flex d-md-flex d-sm-flex d-block justify-content-between mb-3">
                        <div className="d-flex">
                            <ImageUtils src={user.Subordinates.ImageUrl} width={30} height={30} name={user.Subordinates.FullName} 
                            className="mr-2 mt-lg-0 mt-md-0 mt-sm-0 mt-n2 mb-2 mb-lg-0 mb-md-0 mb-sm-0"/>
                            <p className="normal font-weight-bold">{user.Subordinates.FullName}</p>
                            <p className="normal pl-2">{user.Subordinates.Position}</p>
                        </div>
                        <div className="d-flex">
                        <button className="font-weight-bold small border-0 bg-primary text-white py-2 px-3 mr-2  outline-none btn-border-radius" 
                            onClick={()=>window.open("https://teams.microsoft.com/l/chat/0/0?users="+ user.Subordinates.EmailAddress)} >{strings.common.chat}</button>
                        <button className="font-weight-bold small border-0 bg-primary text-white py-2 px-3 mr-2  border-0 outline-none btn-border-radius" 
                            onClick={()=> {this.setState({showGiveFeedbackPopup: true, requestFromMem: true})}}>{strings.feedback.giveFeedback}</button>
                        {getIsEnabled(AllFeatures.FE_GOAL_CREATE_GOAL) && <button className="font-weight-bold small border-0 bg-primary text-white py-2 px-3 border-0 outline-none btn-border-radius" 
                            onClick={()=> this.createGoalFromNudge(false)}>{strings.feedback.createGoal}</button>}
                        </div>
                    </div>
                </div>
                }
                
                <div className="mt-4">
                    {this.renderOverview()}
                    {showGiveFeedbackPopup && <GiveFeedbackModal    
                                                    closeModal={this.closeGiveFeedbackModal.bind(this)} 
                                                    show={this.state.showGiveFeedbackPopup} 
                                                    requestFromMem={false}
                                                    fromGiven={false}
                                                    userData={headerBanner === false && user !== '' && user}
                                                    fromManager={headerBanner === false ? true : false}
                                                    fromNotification={false}/>}
                    {showReqFeedbackPopup && <ReqFeedbackModal  
                                                    closeModal={this.closeReqFeedbackModal.bind(this)} 
                                                    show={this.state.showReqFeedbackPopup}
                                                    ifManager={this.state.ifManager}
                                                    fromRequestTab={false}/>}
                    {showAllcompetenciesPopup && this.renderAllcompetenciesModal()}
                    {showGoalModal && <AddGoalModal 
                                        RevieweeUserId={headerBanner === false && user !== '' ? user.Subordinates.UserId : LoggedInUserId}
                                        UserID = {headerBanner === false && user !== '' ? user.Subordinates.UserId :LoggedInUserId}
                                        yourgoalflag={true}
                                        show={this.state.OpenGoalModal} 
                                        imageurl={headerBanner === false && user !== '' ? user.Subordinates.ImageUrl : null}
                                        fullname={headerBanner === false && user !== '' ? user.Subordinates.FullName : null} 
                                        fromFeedback={headerBanner === false && user !== '' ? true : false}
                                        enablerevieweeflag={headerBanner === false && user !== '' ? true : false}
                                        managerName={headerBanner === false && user !== '' ? LoggedInUserProfile.name : managerProfile.FullName}
                                        managerImageUrl={headerBanner === false && user !== '' ? LoggedInUserProfile.profile_image : managerProfile.ImageUrl}
                                        managerUserId={headerBanner === false && user !== '' ? LoggedInUserId :  managerProfile.UserId}
                    onHide={() => {this.setState({showGoalModal: false, OpenGoalModal: false})}} />}
                </div>
            </div>
            </React.Fragment>
        )
    }
}

export default withRouter(overview);
