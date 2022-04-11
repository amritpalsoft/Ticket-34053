import React from 'react';
import { withRouter } from 'react-router-dom';
import './quest.scss';
import '../../assets/css/floating-labels.css';
import bannerIcon from '../../assets/images/quest_banner_img.png';
import { Api } from './../../api/Api';
import GetAPIHeader from './../../api/ApiCaller';
import ErrorHandling from './../../api/ErrorHandling';
import QuestList from './QuestList';
import PendingTab from './pendingTab';
import CircularProgressBar from './../../components/progressBar/CircularProgressBar';
import { easeQuadInOut } from "d3-ease";
import HeaderBanner from '../../components/Banner/headerBanner';
import $ from "jquery";
import { withTranslation } from 'react-i18next';
import AdminQuest from './AdminQuest';
import SlimLoader from './../../components/SlimLoader/slimLoader';
import Loading from '../../components/Loading/loading';
import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal';
import { AllFeatures } from "../../components/Services/core";
import { getIsEnabled } from "../../constants/constants";
import StorageUtils from '../../containers/utils/StorageUtils';
import {connect} from 'react-redux';
import {setWarningPopupStatus} from '../../redux/actions/commonActions';

const Storage = new StorageUtils();
const userAchivements = JSON.parse(localStorage.getItem('userAchivements'));
var qs = require('qs');
//issue understanding still in pending
class Quests extends React.Component {
    _isMounted = false;
    constructor(props) {
        super(props);

        this.state = {
            bannerClosed: 0,
            inReviewCount: 0,
            pendingCount: '',
            language: 'en',
            questModal: false,
            questModalId: '',
            loading: 1,
            showAdmin: false,
            fromTeams: false,
            questList: [],
            questLoading: 1,
            questResults: [],
            mQuestModal: false,
            mQuestModalId: '',
            userAvailablePoint: 0,
            setInitialTabChange: false,
        };
        this.adminChild = React.createRef();
        this.pendingTabChild = React.createRef();

        this.handleClickOutside = this.handleClickOutside.bind(this);
    }

    getQuestCount() {
        new Api(GetAPIHeader(Storage.getAccessToken())).v31.getModeratorQuest(undefined, undefined)
            .then(res => {
                this.setState({ pendingCount: res.Total });
                // tab redirection from url
                if (this.props.match.params.tab) {
                    $('#nav-' + this.props.match.params.tab + '-tab').tab('show')
                }
                if (!this.state.setInitialTabChange) {
                    this.setTabChanging();
                }
                this.setState({
                    setInitialTabChange: true
                });
            }).catch((err) => {				ErrorHandling(err)
                console.log(err);
            });
    }

    getQuestList() {
        this.setState({ questLoading: 1 });
        new Api(GetAPIHeader(Storage.getAccessToken())).v31.getUserQuest(undefined, undefined)
            .then(results => {
                if (results != null) {
                    this.setState({ questResults: results.Claimed });
                    if (localStorage.getItem('activeQuestTab') == '#nav-completed') {
                        this.mapQuest(results.Claimed);
                    } else {
                        this.mapQuest(results.Incomplete);
                    }
                } else {
                    this.setState({ questLoading: 0 });
                }
            }).catch((err) => {				ErrorHandling(err)
                console.log(err);
            });
    }

    mapQuest(result) {
        const myQuest = result != undefined && result != null && result != "" && result.length > 0 ? result.map((item) => {
            return {
                BadgeCode: item.BadgeCode,
                BadgeImageUrl: item.BadgeImageUrl,
                BadgeName: item.BadgeName,
                CategoryName: item.CategoryName,
                Completed: item.Completed,
                Description: item.Description,
                EndDate: item.EndDate,
                HasNoExpireDate: item.HasNoExpireDate,
                Id: item.Id,
                Name: item.Name,
                Point: item.Point,
                QuestId: item.QuestId,
                RecurrenceType: item.RecurrenceType,
                RecurrenceTypeId: item.RecurrenceTypeId,
                StartDate: item.StartDate,
                Status: item.Status,
                StatusId: item.StatusId,
                StreakDuration: item.StreakDuration,
                StreakPoint: item.StreakPoint,
                StreakQuest: item.StreakQuest,
                UpdatedDate: item.UpdatedDate,
                Skills: item.Skills,
                Conditions: item.Conditions,
                CreatedDate: item.CreatedDate,
                MyConditions: [...item.Conditions,
                {
                    Total: item.Conditions.length,
                    ModeratorsList: item.Conditions.filter((item, i, arr) =>
                        arr.findIndex(t => t.ModeratorId === item.ModeratorId) === i && item.isModeratorQuest === true).map(x => {
                            return (
                                {
                                    id: x.ModeratorId,
                                    img: x.ModeratorImageUrl,
                                    name: x.ModeratorName

                                }
                            )
                        }),
                    Name: item.Conditions.filter((item, i, arr) =>
                        arr.findIndex(t => t.ModeratorId === item.ModeratorId) === i && item.isModeratorQuest === true).length == 1 ? item.Conditions.filter((item, i, arr) =>
                            arr.findIndex(t => t.ModeratorId === item.ModeratorId) === i && item.isModeratorQuest === true)[0].ModeratorName : (item.Conditions.filter((item, i, arr) =>
                                arr.findIndex(t => t.ModeratorId === item.ModeratorId) === i && item.isModeratorQuest === true).length + ' People'),
                    Count: item.Conditions.filter((item, i, arr) =>
                        arr.findIndex(t => t.ModeratorId === item.ModeratorId) === i && item.isModeratorQuest === true).length,
                }],
            }
        }) : [];
        if (myQuest) {
            this.setState({ questList: myQuest, questLoading: 0 });
        }
    }

    loadOnlyClaimed(){
        this.mapQuest(this.state.questResults)
        $(".page-wrapper").addClass("toggled");
        localStorage.setItem('activeQuestTab', "#nav-completed");
        $('.nav-tabs a[href="#nav-completed"]').tab('show');
    }

    getPoints() {
        new Api(GetAPIHeader(Storage.getAccessToken())).v31.getUserPoints()
            .then(results => {
                this.setState({
                    userAvailablePoint: results.AccumulatedEligiblePoints
                });
                localStorage.setItem('AccumulativeEligiblePoints', results.AccumulatedEligiblePoints)
            }).catch((err) => {				ErrorHandling(err)
                console.log(err)
            });
    }

    componentDidMount() {
        const {dispatch} = this.props;
        dispatch(setWarningPopupStatus(false));
        this._isMounted = true;
        this.getUnitTypeMobileForBackOffice();
        this.getQuestCount();
        if (this.props.location.search) {
            let queryParam = qs.parse(this.props.location.search, { ignoreQueryPrefix: true });
            if (queryParam.avoidDuplicate) {
                this.props.history.push("./quest");
            } else {
                this.getQuestList();
            }
        } else {
            this.getQuestList();
        }
        this.accessQuestModal();
        this.getPoints();
        document.addEventListener('click', this.handleClickOutside, true);
        localStorage.setItem('activeQuestTab', "#nav-ongoing"); 
    }

    componentWillUnmount() {
        document.removeEventListener('click', this.handleClickOutside, true);
        localStorage.setItem('activeQuestTab', "#nav-ongoing");  
    }

    getUnitTypeMobileForBackOffice() {
        let checkExist = JSON.parse(localStorage.getItem('unitCategoryResponse'));
        if (checkExist == null || checkExist == "" || checkExist == undefined) {
            let reqUnitIds = { "UnitTypeIds": [], "UnitValueIds": [] };
            new Api(GetAPIHeader(Storage.getAccessToken())).v31.getUnitTypeMobileForBackOffice(reqUnitIds, { pageNumber: 1, pageSize: 100000, isCreateUser: false })
                .then(unitResponse => {
                    if (unitResponse.Result.length > 0) {
                        localStorage.setItem('unitCategoryResponse', JSON.stringify(unitResponse));
                    }
                })
        }
    }

    accessQuestModal() {
        if (this.props.location.search) {
            let queryParam = qs.parse(this.props.location.search, { ignoreQueryPrefix: true });
            if ((queryParam.questid || queryParam.mquestid) && queryParam.host) {
                this.setState({ fromTeams: true });
            }
            if (queryParam.questid) {
                this.setState({
                    questModal: true,
                    questModalId: queryParam.questid
                }, () => {
                    this.renderModal();
                })
            }

            if (queryParam.mquestid) {
                this.setState({
                    mQuestModal: true,
                    mQuestModalId: queryParam.mquestid
                }, () => {
                    this.renderModeratorQuestModal();
                })
            }
        }
    }

    renderModeratorQuestModal() {
        const { mQuestModal, mQuestModalId } = this.state;
        $("#questModal").modal("show");
        if (this.state.fromTeams) {
            $('.modal-backdrop').addClass('modal-backdrop--custom');
        }
        if(mQuestModal) {
        return (
                <div id="questModal" className="modal fade p-0 m-0 modal--custom" tabindex="-1" role="dialog">
                <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
                    <div className="modal-content p-0 m-0 border-0">
                        <div className="modal-body p-0">
                            <PendingTab
                                PointsType={(userAchivements != null && userAchivements.PointsType) ? userAchivements.PointsType : "ep"}
                                mQuestModalId={mQuestModalId}
                                viewQuestPopup={true}
                                getTabCount={this.getQuestCount.bind(this)}
                                marginBottom="app-card mb-0"
                            />
                        </div>
                    </div>
                </div>
                 </div>
             )
        }
    }

    handleClose = () => {
        this.setState({ questModal: false, questModalId: '' });
        $("#questModal").modal("hide");
    }

    handleClickOutside(event) {
        const self = this;
        var modal = document.getElementById('questModal');
        window.onclick = function (event) {
            if (event.target == modal) {
                self.handleClose();
            }
        }
        if(event.target.id === 'questModal') {
            this.setState({mQuestModal: false, mQuestModalId: ''});
            $("#questModal").modal("hide");
        }
    }

    editAdminQuest(reqId) {
        this.getQuestById(reqId);
    }

    getQuestById(id){
        if(id && id != null && id != "" && id != undefined){
            this.props.history.push("/editquest"+ "?editId="+id);
        }
    }

    setTabChanging() {
        let th = this;
        $(document).ready(function () {
            $('a[data-toggle="tab"]').on("shown.bs.tab", function (e) {
                localStorage.setItem('questActiveTab', $(e.target).attr('href'));

                if ($(e.target).attr("href") == "#nav-ongoing") {
                    $(".page-wrapper").addClass("toggled");
                    localStorage.setItem('activeQuestTab', "#nav-ongoing");
                    $('.nav-tabs a[href="#nav-ongoing"]').tab('show');
                    th.getQuestList();
                }

                if ($(e.target).attr("href") == "#nav-completed") {
                    $(".page-wrapper").addClass("toggled");
                    localStorage.setItem('activeQuestTab', "#nav-completed");
                    $('.nav-tabs a[href="#nav-completed"]').tab('show');
                    th.getQuestList();
                }

                if ($(e.target).attr("href") == "#nav-moderator") {
                    $(".page-wrapper").addClass("toggled");
                    localStorage.setItem('activeQuestTab', "#nav-moderator");
                    $('.nav-tabs a[href="#nav-moderator"]').tab('show');
                    th.pendingTabChild.current.getInReviewQuests(1);
                }

                if ($(e.target).attr("href") == "#nav-admin") {
                    $(".page-wrapper").removeClass("toggled");
                    localStorage.setItem('activeQuestTab', "#nav-admin");
                    $('.nav-tabs a[href="#nav-admin"]').tab('show');
                    th.adminChild.current.clearPreviousState();
                    th.adminChild.current.getUnitTypeMobileForBackOffice();
                }
            });
        });
        var activeTab = localStorage.getItem('questActiveTab');
        if (activeTab == "#nav-admin") {
            $(".page-wrapper").removeClass("toggled");
            $('.nav-tabs a[href="' + activeTab + '"]').tab('show');
            th.setState({ showAdmin: true })
        }
    }

    CloneQuest(cloneId){
        if(cloneId && cloneId != null && cloneId != "" && cloneId != undefined){
            this.props.history.push("/editquest"+ "?cloneId="+cloneId);
        } 
    }

    closeModal() {
        this.setState({
            questModal: false
        });
        this.props.history.push('./quest')
    }
    renderModal() {
        const { questModal, questModalId, questLoading } = this.state;
        $("#questModal").modal("show");
        if (this.state.fromTeams) {
            $('.modal-backdrop').addClass('modal-backdrop--custom');
        }
        return (
            questModal && <div style={{ padding: '0px' }} className="p-0 m-0">
                <Modal
                    // dialogClassName={"questModal"}
                    show={questModal}
                    backdrop={questModal}
                    onHide={() => { this.closeModal() }}
                    centered
                    size="lg"
                    className="p-0 m-0"
                    aria-labelledby="contained-modal-title-vcenter"
                >
                    <div className={"maincontainer p-0 m-0 border-0"}>
                        <Modal.Body className="p-0">
                            {questLoading ? <Loading /> :
                                <QuestList
                                    PointsType={(userAchivements != null && userAchivements.PointsType) ? userAchivements.PointsType : "ep"}
                                    questModalId={questModalId}
                                    getTabCount={this.getQuestCount.bind(this)}
                                    marginBottom="app-card mb-0"
                                    questList={this.state.questList}
                                    questResults={this.loadOnlyClaimed.bind(this)}
                                    loading={this.state.questLoading}
                                    getQuestList={this.getQuestList.bind(this)}
                                />}
                        </Modal.Body>
                    </div>
                </Modal>
            </div>
        )
    }




    render() {
        const { t } = this.props;

        return (
            <>
                <SlimLoader isAnimating={!this._isMounted} />
                <div className="container">
                    <h3 className="page-header">{t("quest.quest")}</h3>
                    {this.renderModal()}
                    {this.renderModeratorQuestModal()}
                    {this.state.pendingCount > 0 ?
                        <nav>
                            <div className="nav nav-tabs app-tabs" id="nav-tab" role="tablist">
                                <a className="nav-item nav-link active" id="nav-ongoing-tab"
                                    data-toggle="tab" href="#nav-ongoing" role="tab" aria-controls="nav-ongoing"
                                    aria-selected="true" onClick={() => this.setState({ showAdmin: false, questLoading: 1, questList: [] })}>{t("quest.ongoing")}</a>

                                <a className="nav-item nav-link " id="nav-completed-tab"
                                    data-toggle="tab" href="#nav-completed" role="tab" aria-controls="nav-completed"
                                    aria-selected="false" onClick={() => this.setState({ showAdmin: false, questLoading: 1, questList: [] })}>{t("quest.completed")}</a>
                                <a className="nav-item nav-link " id="nav-moderator-tab"
                                    data-toggle="tab" href="#nav-moderator" role="tab" aria-controls="nav-moderator"
                                    aria-selected="false" onClick={() => this.setState({ showAdmin: false, modQuestLoading: 1, modPendingArray: [] })}>{t("quest.moderator")}</a>

                                {(getIsEnabled(AllFeatures.BO_QUEST_MANAGE) || getIsEnabled(AllFeatures.BO_QUEST_CreateEdit_MANAGE)) && <a className="nav-item nav-link " id="nav-admin-tab"
                                    data-toggle="tab" href="#nav-admin" role="tab" aria-controls="nav-admin"
                                    aria-selected="false" onClick={() => this.setState({ showAdmin: true })}>{t("quest.admin")}</a>
                                }

                            </div>
                        </nav>
                        :
                        <nav>
                            <div className="nav nav-tabs app-tabs" id="nav-tab" role="tablist">
                                <a className="nav-item nav-link active" id="nav-ongoing-tab"
                                    data-toggle="tab" href="#nav-ongoing" role="tab" aria-controls="nav-ongoing"
                                    aria-selected="true" onClick={() => this.setState({ showAdmin: false, questLoading: 1, questList: [] })}>{t("quest.ongoing")}</a>

                                <a className="nav-item nav-link " id="nav-completed-tab"
                                    data-toggle="tab" href="#nav-completed" role="tab" aria-controls="nav-completed"
                                    aria-selected="false" onClick={() => this.setState({ showAdmin: false, questLoading: 1, questList: [] })}>{t("quest.completed")}</a>

                                {(getIsEnabled(AllFeatures.BO_QUEST_MANAGE) || getIsEnabled(AllFeatures.BO_QUEST_CreateEdit_MANAGE)) &&
                                    <a className="nav-item nav-link " id="nav-admin-tab"
                                        data-toggle="tab" href="#nav-admin" role="tab" aria-controls="nav-admin"
                                        aria-selected="false" onClick={() => this.setState({ showAdmin: true })}>{t("quest.admin")}</a>
                                }
                            </div>
                        </nav>
                    }
                    {
                        this.state.showAdmin ?
                            <div className="row float-right" style={{ marginTop: "-2.5rem", paddingRight: "16px" }}>
                                <div className="col col-sm-12">
                                    <form className="form-inline my-2 my-lg-0">
                                    <Button className="creteQuestButton" onClick={() => {
                                        $(".page-wrapper").addClass("toggled");
                                        this.props.history.push("/editquest")
                                        }}>
                                            <span className="textAlignment">{t("quest.createNewQuest")}</span>
                                        </Button>
                                    </form>
                                </div>
                            </div>
                            :
                            null
                    }
                    {!this.state.showAdmin &&
                        <HeaderBanner bannerImg={bannerIcon}
                            bannerHeader={t("quest.bannerHeader")}
                            bannerDesc={(t("quest.bannerDesc"))}
                            bannerBackground={'#ffefe4'} bannerH4Color={'#ff9649'} />}
                    <br />

                    <div className="row">
                        <div className={this.state.showAdmin ? "col-sm-12" : "col-sm-8"}>
                            <div className="tab-content" id="nav-tabContent">
                                <div className="tab-pane fade show active" id="nav-ongoing" role="tabpanel"
                                    aria-labelledby="nav-ongoing-tab">
                                    <QuestList completed={false}
                                        PointsType={(userAchivements != null && userAchivements.PointsType) ? userAchivements.PointsType : "ep"}
                                        getTabCount={this.getQuestCount.bind(this)}
                                        questList={this.state.questList}
                                        loading={this.state.questLoading}
                                        getQuestList={this.getQuestList.bind(this)} />
                                </div>
                                <div className="tab-pane fade" id="nav-completed" role="tabpanel"
                                    aria-labelledby="nav-completed-tab">
                                    <QuestList completed={true}
                                        PointsType={(userAchivements != null && userAchivements.PointsType) ? userAchivements.PointsType : "ep"}
                                        questList={this.state.questList}
                                        loading={this.state.questLoading}
                                        getQuestList={this.getQuestList.bind(this)} />
                                </div>
                                <div className="tab-pane fade" id="nav-moderator" role="tabpanel"
                                    aria-labelledby="nav-moderator-tab">
                                    <PendingTab PointsType={(userAchivements != null && userAchivements.PointsType) ? userAchivements.PointsType : "ep"}
                                        ref={this.pendingTabChild} getTabCount={this.getQuestCount.bind(this)} />
                                </div>
                                {(getIsEnabled(AllFeatures.BO_QUEST_MANAGE) || getIsEnabled(AllFeatures.BO_QUEST_CreateEdit_MANAGE)) && <div className="tab-pane fade" id="nav-admin" role="tabpanel" aria-labelledby="nav-admin-tab">
                                    <AdminQuest ref={this.adminChild} editAdminQuest={this.editAdminQuest.bind(this)} CloneQuest={this.CloneQuest.bind(this)}/>
                                </div>}
                            </div>
                        </div>
                        {!this.state.showAdmin &&
                            <div className="col-sm-4">
                                {getIsEnabled(AllFeatures.BO_QUEST_CreateEdit_MANAGE) && <div className="align-items-center justify-content-center text-center mb-3">
                                    <Button className="createQuestButtonList" onClick={() => { this.props.history.push("/editquest") }}>
                                        <span className="textAlignment">{t("quest.createNewQuest")}</span>
                                    </Button>
                                </div>
                                }
                                <div className="app-card">
                                    <h6 className="text-gray mb-3">{t("quest.points")}</h6>
                                    <div className="text-center points-circular-progress">
                                        <CircularProgressBar
                                            strokeWidth="20"
                                            sqSize="210"
                                            duration={0.5}
                                            easingFunction={easeQuadInOut}
                                            percentage={this.state.userAvailablePoint}
                                            myRank='null'
                                            UnlockPoints={userAchivements != null ? userAchivements.UnlockPoints : ""}
                                            PointsType={(userAchivements != null && userAchivements.PointsType) ? userAchivements.PointsType : "ep"} />
                                    </div>
                                </div>
                            </div>}

                    </div>
                </div>
            </>
        )
    }
}
export default withTranslation('translation')((connect())(withRouter(Quests)));
