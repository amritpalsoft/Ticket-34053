import React from 'react';
import {withRouter} from 'react-router-dom';
import {Api} from '../../api/Api';
import GetAPIHeader from '../../api/ApiCaller';
import ErrorHandling from '../../api/ErrorHandling';
import './feedback.scss';
import $ from 'jquery';
import LocalizedStrings from "react-localization";
import { localizedStrings } from '../../language/localizedStrings';
import Overview from './Overview';
import ReceivedFeedback from './ReceivedFeedback';
import RequestFeedback from './RequestFeedback';
import GivenFeedback from './GivenFeedback';
import ManagerFeedback from './ManagerFeedback';
import {LocalDate} from '../../constants/constants';
import SeeFeedbackModal from './SeeFeedbackModal';
import SlimLoader from '../../components/SlimLoader/slimLoader';
import {connect} from 'react-redux';
import {setWarningPopupStatus} from '../../redux/actions/commonActions';
import StorageUtils from '../../containers/utils/StorageUtils';

const Storage = new StorageUtils();
var qs = require('qs');
class Feedback extends React.Component {
    _isMounted=false;
    constructor(props) {
        super(props);

        this.state = {
            language: "en",
            loading: 0,
            bannerDesc: "Constructive feedback helps your peers to improve and motivate. This week you have given ... feedback",
            hideManager: false,
            reqFeedbackTab: false,
            pageNumberRecieve: 1,
            pageSizeRecieve: 10,
            hasMoreRecieve: true,
            receiveLoading: 0,
            combinedReceivedFeedbacks: [],
            receiveFeedbackArr: [],
            givenFeedbacksArr: [],
            combinedGivenFeedbacks: [],
            combinedRecentlyArr: [],
            pageNumberGiven: 1,
            pageSizeGiven: 10,
            hasMoreGiven: true,
            givenLoading: 0,
            pageNumberRecentlyReceive: 1,
            pageSizeRecentlyReceive: 10,
            hasMoreRecentlyReceive: true,
            recentlyReceiveLoading: 0,
            doingGoodAtArr:[],
            improveOnArr:[],
            allFeedbacks:[],
            summaryLoading: 1,
            filterVal: 2,
            nudgeResp:'',
            filterLoading: 0,
            highPerformersArr:[],
            lowPerformersArr:[],
            managerLoading: 0,
            fromNotificationInfo: {},
            showGiveFeedback: false,
            showSeeFeedback: false,
            managerFilterVal: 2,
        }
    }
    receiveVoluntaryFeedbacksByUser(pgNo, pageSize){
        if(this.state.hasMoreRecieve == true){
            this.setState({pageNumberRecieve: pgNo});
            if(this.state.pageNumberRecieve === 1){
                this.setState({receiveLoading: 1});
            } else {
                this.setState({receiveLoading: 0});
            }
            new Api(GetAPIHeader(Storage.getAccessToken())).v31.receiveVoluntaryFeedbacksByUser({
                pageNumber:pgNo,
                pageSize: pageSize})
            .then(response=>{
                this.setState({receiveLoading: 0})
                if(response.Result.length> 0 ){
                    this.setState({combinedReceivedFeedbacks: [...this.state.combinedReceivedFeedbacks, ...response.Result]});
                    if(response.Result.length < pageSize || response.Total === pageSize || response.Total === this.state.combinedReceivedFeedbacks.length){
                        this.setState({hasMoreRecieve: false, pageNumberRecieve: 1});
                    } else {
                        this.setState({hasMoreRecieve: true});
                    }
                    const groups = this.state.combinedReceivedFeedbacks.length>0 && this.state.combinedReceivedFeedbacks.reduce((groups, eachFeedback) => {
                        let createdDate = eachFeedback.CreatedDate;
                        let date = LocalDate(createdDate);
                        if (!groups[date]) {
                            groups[date] = [];
                        }
                        groups[date].push(eachFeedback);
                        return groups;
                    }, {});
                    const groupArrays = Object.keys(groups).map((date) => {
                        return {
                            date,
                            feedback: groups[date]
                        };
                    });
                this.setState({receiveFeedbackArr: groupArrays});
            }
            }).catch((err) => {				ErrorHandling(err)
                this.setState({receiveLoading: 0});
            })
        }
    }

    getGivenVoluntaryFeedbacksByUser(pgNo, pageSize, fromGivenTab){
        if(this.state.hasMoreGiven == true || fromGivenTab === true){
            this.setState({pageNumberGiven: pgNo})
        if(this.state.pageNumberGiven === 1){
            this.setState({givenLoading: 1});
        } else {
            this.setState({givenLoading: 0});
        }
        if(fromGivenTab === true){
            this.setState({combinedGivenFeedbacks: []});
        }
        new Api(GetAPIHeader(Storage.getAccessToken())).v31.getGivenVoluntaryFeedbacksByUser({
            pageNumber:pgNo,
            pageSize: pageSize})
            .then(response=>{
                this.setState({givenLoading: 0})
                if(response.Result.length> 0 ){
                this.setState({combinedGivenFeedbacks: [...this.state.combinedGivenFeedbacks, ...response.Result]});
                if(response.Result.length < pageSize || response.Total === pageSize || response.Total === this.state.combinedGivenFeedbacks.length){
                    this.setState({hasMoreGiven: false, pageNumberGiven: 1});
                  } else {
                    this.setState({hasMoreGiven: true});
                  }
                  const groups = this.state.combinedGivenFeedbacks.length>0 && this.state.combinedGivenFeedbacks.reduce((groups, eachFeedback) => {
                    let createdDate = eachFeedback.CreatedDate;
                    let date = LocalDate(createdDate);
                    if (!groups[date]) {
                        groups[date] = [];
                    }
                    groups[date].push(eachFeedback);
                    return groups;
                }, {});
                const groupArrays = Object.keys(groups).map((date) => {
                    return {
                        date,
                        feedback: groups[date]
                    };
                });

                this.setState({givenFeedbacksArr: groupArrays});
            }
            }).catch((err) => {				
                ErrorHandling(err)
                this.setState({givenLoading: 0});
            })
        }
    }
    filterValClick(val){
        this.getFeedbackSummary(val, this.state.userId, true);
        this.getFeedbacksNudge(val);
        this.setState({filterVal: val, doingGoodAtArr: [], improveOnArr: [], allFeedbacks: []});
    }
    getFeedbacksNudge(type){
        new Api(GetAPIHeader(Storage.getAccessToken())).v31.getFeedbacksNudge({type: type})
            .then(response=>{
                if(response != null && response !== ''){
                    this.setState({nudgeResp: response});
                }
            }).catch((err) => {				
                ErrorHandling(err)
            });
    }
    getFeedbackById(id, type){
        let isRequest;
        if(type === "AdhocFeedbackRequest"){
            isRequest = true;
        } else {
            isRequest = false
        }
        new Api(GetAPIHeader(Storage.getAccessToken())).v31.getAdhocFeedbackByRequestId(id, {IsRequest: isRequest})
            .then(response=>{
                this.setState({ fromNotificationInfo: response, 
                                showGiveFeedback: isRequest? true: false,
                                showSeeFeedback: isRequest? false: true                         
                            });
            }).catch((err) => {				ErrorHandling(err)
                
            });
    }
    adaptiveCardRedirect(){
        if (this.props.location.search) {
            let queryParam = qs.parse(this.props.location.search, { ignoreQueryPrefix: true });            
            if (queryParam.redirectTab) {
                let redirectTab = queryParam.redirectTab; 
                if(redirectTab == "received"){
                    $('.nav-tabs a[href="#nav-received"]').tab('show');
                    localStorage.setItem('activeTab', "#nav-received");
                }else if(redirectTab == "request"){  
                    localStorage.setItem('activeTab', "#nav-request");                      
                    $('.nav-tabs a[href="#nav-request"]').tab('show');
                    $('[href="#nav-peers"]').tab('show');
                }
            }
        }        
    }
    componentDidMount() {
        const {dispatch} = this.props;
        dispatch(setWarningPopupStatus(false));
        this._isMounted=true;
        this.getFeedbackSummary(2,'');
        this.adaptiveCardRedirect();
        this.recentlyReceiveFeedbacksByUser(this.state.pageNumberRecentlyReceive, this.state.pageSizeRecentlyReceive);
        this.getFeedbacksNudge(2);
        let th=this;
        const { history }= th.props;
        if(history && history.location && history.location.state && history.location.state.notificationType) {
            th.getFeedbackById(history.location.state.notificationId ,history.location.state.notificationType );
        }
        $(document).ready(function () {
            $('a[data-toggle="tab"]').on("shown.bs.tab", function (e) {   
                if ($(e.target).attr("href") == "#nav-overview") {
                    th.getFeedbackSummary(th.state.filterVal,'');
                    th.getFeedbacksNudge(th.state.filterVal)
                    th.setState({combinedRecentlyArr: [], pageNumberRecentlyReceive: 1, hasMoreRecentlyReceive: true});
                    th.recentlyReceiveFeedbacksByUser(th.state.pageNumberRecentlyReceive, th.state.pageSizeRecentlyReceive)
                    th.setState({
                        reqFeedbackTab: false,
                    })
                 }
                 if ($(e.target).attr("href") == "#nav-received") {
                    th.setState({combinedReceivedFeedbacks: [], pageNumberRecieve: 1, hasMoreRecieve: true});
                    th.receiveVoluntaryFeedbacksByUser(th.state.pageNumberRecieve, th.state.pageSizeRecieve);
                 }

                 if ($(e.target).attr("href") == "#nav-given") {
                    th.setState({combinedGivenFeedbacks: [], pageNumberGiven: 1, hasMoreGiven: true});
                    th.getGivenVoluntaryFeedbacksByUser(th.state.pageNumberGiven, th.state.pageSizeGiven, false);
                 }
                 if ($(e.target).attr("href") == "#nav-request") {
                    if(history && history.location && history.location.state && history.location.state.notificationType && 
                        history.location.state.notificationType === "AdhocFeedbackGiveAssigned") {
                        $('[href="#nav-yours"]').tab('show');
                    } else {
                        $('[href="#nav-peers"]').tab('show');
                    }
                 }
                 if ($(e.target).attr("href") == "#nav-manager") {
                    $('[href="#nav-manager"]').tab('show');
                    th.getAllSubordinatesPerformances(th.state.managerFilterVal);
                 }
            })
        })
    }

    handleManagerFilter(val) {
        this.setState({ managerFilterVal: val});
    }

      setData(){
        $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
            localStorage.setItem('activeTab', $(e.target).attr('href'));
          });
          var activeTab = localStorage.getItem('activeTab');
          if(activeTab){
              $('.nav-tabs a[href="' + activeTab + '"]').tab('show');
          }
      }

      getAllSubordinatesPerformances(type){
        this.setState({lowPerformersArr: [], highPerformersArr: []});
        // if(this.state.lowPerformersArr.length === 0 || this.state.highPerformersArr.length === 0){
        this.setState({managerLoading: 1});
        new Api(GetAPIHeader(Storage.getAccessToken())).v31.getAllSubordinatesPerformances({type: type})
            .then(response=>{
                if(response.Result.length > 0){
                const sortedArray = response.Result.sort((a,b) => (a.AvgRating < b.AvgRating) ? 1 : ((b.AvgRating < a.AvgRating) ? -1 : 0)); 
                this.setState({managerLoading: 0});
                sortedArray.map(eachFeedback=>{
                        if(eachFeedback.AvgRating > 3.01){
                                this.state.highPerformersArr.push(eachFeedback);
                                const sortedHighPerformence = this.state.highPerformersArr.sort((a,b) => (a.AvgRating < b.AvgRating) ? 1 : ((b.AvgRating < a.AvgRating) ? -1 : 0)); 
                                this.setState({highPerformersArr: sortedHighPerformence})
                        } else  {
                                this.state.lowPerformersArr.push(eachFeedback)
                                const sortedLowPerformence = this.state.lowPerformersArr.sort((a,b) => (a.AvgRating > b.AvgRating) ? 1 : ((b.AvgRating > a.AvgRating) ? -1 : 0)); 
                                this.setState({lowPerformersArr: sortedLowPerformence});
                        }    
                    }) 
                }
            }).catch((err) => {				ErrorHandling(err)
                this.setState({managerLoading: 0});
            });
        // }
    }
    getFeedbackSummary(type, userId, fromFilter){
        let pastReceivedUserId;
        if( this.props.headerBanner === false && this.props.user !== ''){
            pastReceivedUserId = this.props.user.Subordinates.UserId
        } else {
            pastReceivedUserId = ''
        }
        let strings = new LocalizedStrings(localizedStrings);
        strings.setLanguage(this.state.language);
        if(fromFilter){
            this.setState({filterLoading: 1})
        } else {
            this.setState({summaryLoading: 1});
        }
        this.setState({doingGoodAtArr: [], improveOnArr: [], allFeedbacks: []});
        new Api(GetAPIHeader(Storage.getAccessToken())).v31.getFeedbackSummary({type: type, userId: pastReceivedUserId})
            .then(response => {
                if(fromFilter){
                    this.setState({filterLoading: 0})
                } else {
                    this.setState({summaryLoading: 0});
                }
                if(response !== null && response !== '' && response !== undefined){
                    this.setState({ managerProfile: response.ManagerProfile})
                    localStorage.setItem('LoggedInUserID', response.UserId);
                    if(response.IsManager === true){
                        this.setState({hideManager: false});
                    } else {
                        this.setState({hideManager: true});
                    }
                    if(response.TotalGivenFeedBacksCount === 0 ||  response.TotalGivenFeedBacksCount === 1){
                        this.setState({bannerDesc: strings.feedback.feedbackBannerDescPrimary
                        + response.TotalGivenFeedBacksCount + strings.feedback.feedbackBannerDescSecondary},this.setData.bind(this));
                    } else {
                        this.setState({bannerDesc: strings.feedback.feedbackBannerDescPrimary
                        + response.TotalGivenFeedBacksCount + strings.feedback.feedbackBannerDescSecondary1}, this.setData.bind(this));
                    }
                    if(response.FeedbackInfo.length> 0){
                        const sortedArray = response.FeedbackInfo.sort((a,b) => (a.AvgRating < b.AvgRating) ? 1 : ((b.AvgRating < a.AvgRating) ? -1 : 0)); 
                        this.setState({allFeedbacks: sortedArray});
                        response.FeedbackInfo.map(eachFeedback=>{
                            if(eachFeedback.AvgRating > 3.0){
                                this.state.doingGoodAtArr.push(eachFeedback);
                                const highSortedArray = this.state.doingGoodAtArr.sort((a,b) => (a.AvgRating < b.AvgRating) ? 1 : ((b.AvgRating < a.AvgRating) ? -1 : 0)); 
                                this.setState({doingGoodAtArr: highSortedArray.slice(0, 4)});
                            } else if(eachFeedback.AvgRating < 3.0 || eachFeedback.AvgRating === 3.0){
                                this.state.improveOnArr.push(eachFeedback);
                                const lowSortedArray = this.state.improveOnArr.sort((a,b) => (a.AvgRating > b.AvgRating) ? 1 : ((b.AvgRating > a.AvgRating) ? -1 : 0)); 
                                this.setState({improveOnArr: lowSortedArray.slice(0, 4)});
                            }    
                        })
                    }
                }
            }).catch((err) => {				ErrorHandling(err)
                if(fromFilter){
                    this.setState({filterLoading: 0})
                } else {
                    this.setState({summaryLoading: 0});
                }
            });
    }
    recentlyReceiveFeedbacksByUser(pgNo, pageSize, userId){
        let pastReceivedUserId;
        if( this.props.headerBanner === false && this.props.user !== ''){
            pastReceivedUserId = this.props.user.Subordinates.UserId
        } else {
            pastReceivedUserId = ''
        }
        if(this.state.hasMoreRecentlyReceive == true){ 
            this.setState({pageNumberRecentlyReceive: pgNo})
            if(this.state.pageNumberRecentlyReceive === 1){
                this.setState({recentlyReceiveLoading: 1});
            } else {
                this.setState({recentlyReceiveLoading: 0});
            }
        new Api(GetAPIHeader(Storage.getAccessToken())).v31.recentlyReceiveFeedbacksByUser({
            userId: pastReceivedUserId,
            pageNumber:pgNo,
            pageSize: pageSize})
            .then(response=>{
                if(response.Result.length > 0 ){
                    this.setState({combinedRecentlyArr: [...this.state.combinedRecentlyArr, ...response.Result]});
                    if(response.Result.length < pageSize || response.Total === pageSize  || response.Total === this.state.combinedRecentlyArr.length){
                        this.setState({hasMoreRecentlyReceive: false, pageNumberRecentlyReceive: 1});
                    } else {
                        this.setState({hasMoreRecentlyReceive: true});
                    }
                    const groups = this.state.combinedRecentlyArr.length>0 && this.state.combinedRecentlyArr.reduce((groups, eachFeedback) => {
                        if(eachFeedback.JobCriteria.length > 0){
                            let createdDate = eachFeedback.JobCriteria[0].GivenDate;
                            let date = LocalDate(createdDate);
                            if (!groups[date]) {
                                groups[date] = [];
                            }
                            groups[date].push(eachFeedback);
                            return groups;
                            }
                    }, {});
                    const groupArrays = Object.keys(groups).map((date) => {
                        return {
                            date,
                            feedback: groups[date]
                        };
                    });
                this.setState({last7DaysArr: groupArrays});
                }
                this.setState({recentlyReceiveLoading: 0});
            }).catch((err) => {				ErrorHandling(err)
                this.setState({recentlyReceiveLoading: 0});
            })
        }
    }
    closeSeeFeedbackModal() {
        this.setState({showSeeFeedback: false});
        this.props.history.push('/feedback');
    }
    render() {
        let strings = new LocalizedStrings(localizedStrings);
        strings.setLanguage(this.state.language);
        const {fromNotificationInfo, showGiveFeedback, showSeeFeedback} = this.state;
        return (
            <React.Fragment>
                <SlimLoader isAnimating={!this._isMounted} />
                <div className="container">
                    <h3 className="page-header">{strings.feedback.feedback}</h3>
                    {this.props.headerBanner === false ? '' :
                    <nav>
                        <div className="nav nav-tabs app-tabs" id="nav-tab" role="tablist" style={{'display':'flex','flex-direction':'row','flex-wrap':'nowrap'}}>
                            <a className="nav-item nav-link active" id="nav-overview-tab"
                               data-toggle="tab" href="#nav-overview" role="tab" aria-controls="nav-overview"
                               aria-selected="false">{strings.feedback.overview}</a>

                            <a className="nav-item nav-link" id="nav-received-tab"
                               data-toggle="tab" href="#nav-received" role="tab" aria-controls="nav-received"
                               aria-selected="false">{strings.feedback.received}</a>
                            
                            <a className="nav-item nav-link" id="nav-given-tab"
                               data-toggle="tab" href="#nav-given" role="tab" aria-controls="nav-given"
                               aria-selected="false">{strings.feedback.given}</a>

                            <a className="nav-item nav-link" id="nav-request-tab"
                               data-toggle="tab" href="#nav-request" role="tab" aria-controls="nav-request"
                               aria-selected="false">{strings.feedback.request}</a>
                            {this.state.hideManager ? '' :
                            <a className="nav-item nav-link no-wrap" id="nav-manager-tab"
                               data-toggle="tab" href="#nav-manager" role="tab" aria-controls="nav-manager"
                               aria-selected="false">{strings.feedback.manager}</a>
                            }
                               
                        </div>
                    </nav>}
                    <div className="tab-content" id="nav-tabContent" style={{padding: "0"}}>
                        <div className="tab-pane fade show active" id="nav-overview" role="tabpanel"
                             aria-labelledby="nav-overview-tab">
                            <Overview bannerDesc={this.state.bannerDesc}
                                        loading={this.state.recentlyReceiveLoading}
                                        summaryLoading={this.state.summaryLoading}
                                        last7DaysArr={this.state.last7DaysArr}
                                        pageNumber={this.state.pageNumberRecentlyReceive}
                                        hasMore={this.state.hasMoreRecentlyReceive}
                                        recentlyReceiveFeedbacksByUser={this.recentlyReceiveFeedbacksByUser.bind(this)}
                                        getFeedbackSummary={this.getFeedbackSummary.bind(this)}
                                        getFeedbacksNudge={this.getFeedbacksNudge.bind(this)}
                                        filterValClick={this.filterValClick.bind(this)}
                                        headerBanner={this.props.headerBanner}
                                        user={this.props.user}
                                        doingGoodAtArr={this.state.doingGoodAtArr}
                                        improveOnArr={this.state.improveOnArr}
                                        allFeedbacks={this.state.allFeedbacks}
                                        nudgeResp={this.state.nudgeResp}
                                        filterVal={this.state.filterVal}
                                        filterLoading={this.state.filterLoading}
                                        managerProfile= {this.state.managerProfile}
                                        />
                        </div>
                        <div className="tab-pane fade" id="nav-received" role="tabpanel"
                             aria-labelledby="nav-received-tab">
                            <ReceivedFeedback bannerDesc={this.state.bannerDesc} 
                               loading={this.state.receiveLoading}
                               receiveFeedbackArr={this.state.receiveFeedbackArr}
                               pageNumber={this.state.pageNumberRecieve}
                               hasMore={this.state.hasMoreRecieve}
                               receiveVoluntaryFeedbacksByUser={this.receiveVoluntaryFeedbacksByUser.bind(this)}
                            />
                        </div>
                        <div className="tab-pane fade" id="nav-given" role="tabpanel"
                             aria-labelledby="nav-given-tab">
                            <GivenFeedback bannerDesc={this.state.bannerDesc} 
                               loading={this.state.givenLoading}
                               givenFeedbacksArr={this.state.givenFeedbacksArr}
                               pageNumber={this.state.pageNumberGiven}
                               hasMore={this.state.hasMoreGiven}
                               getGivenVoluntaryFeedbacksByUser={this.getGivenVoluntaryFeedbacksByUser.bind(this)}
                            />
                        </div>
                        <div className="tab-pane fade" id="nav-request" role="tabpanel"
                             aria-labelledby="nav-request-tab">
                                 <RequestFeedback bannerDesc={this.state.bannerDesc} 
                                    fromNotificationInfo={fromNotificationInfo}
                                    showGiveFeedback={showGiveFeedback}/>
                        </div>
                        <div className="tab-pane fade" id="nav-manager" role="tabpanel"
                             aria-labelledby="nav-manager-tab">
                            <ManagerFeedback bannerDesc={this.state.bannerDesc}
                                            lowPerformersArr={this.state.lowPerformersArr}
                                            highPerformersArr={this.state.highPerformersArr}
                                            managerLoading={this.state.managerLoading}
                                            getAllSubordinatesPerformances={this.getAllSubordinatesPerformances.bind(this)}
                                            handleManagerFilter={this.handleManagerFilter.bind(this)}
                                            />
                        </div>
                    </div>
                </div>
                {showSeeFeedback &&  <SeeFeedbackModal  
                                                closeModal={this.closeSeeFeedbackModal.bind(this)} 
                                                prefilledData={fromNotificationInfo}
                                                fromNotification={true}/>}
            </React.Fragment>
        )
    }
}

export default (connect())(withRouter(Feedback));
