import React from "react";
import './sidenavbar.scss';
import './../../assets/icons/navIconFonts/style.css'
import $ from 'jquery';
import { Api } from './../../api/Api';
import GetAPIHeader from './../../api/ApiCaller';
import ErrorHandling from "./../../api/ErrorHandling";
import {withRouter, NavLink} from "react-router-dom";
import DetectAgent from '../Services/detectAgent';
import ImageUtils from '../Utils/ImageUtils/ImageUtils';
import { AllFeatures } from '../Services/core';
import { getIsEnabled } from '../../constants/constants';
import { withTranslation } from 'react-i18next';
import { Base64Service } from '../../components/Services/base64';
import UserContext from '../Context/UserContext';
import {TruncateWithDynamicLen, numberWithCommas, getActiveLanguage} from '../../constants/constants';
import * as microsoftTeams from '@microsoft/teams-js';
import StorageUtils from '../../containers/utils/StorageUtils';
import {connect} from 'react-redux';
import {setProfileInfo} from '../../redux/actions/profileActions';
import store from "../../redux/store";
import { setImportantNotificationStatus } from "../../redux/actions/notificationActions";
import i18n from '../../components/Localisation/i18n';

const Storage = new StorageUtils();
const base64Svc = new Base64Service();
const Agent = new DetectAgent();
class SideNavBar extends React.Component {
    static contextType = UserContext;
    _isMounted = false;

    constructor(props) {
        super(props);
        this.state = {
            profileInfo: '',
            features: [],
            unlockPoints: 0,
            levelName: '',
            subEntityId: '',
            AccumulativeEligiblePoints: 0,
            pointsType: 'EP',
            unReadCount: ''
        }
    }

    getProfileInfo() {
        const { dispatch } = this.props;                
        const UserProfile = Storage.getProfile();
            new Api(GetAPIHeader(Storage.getAccessToken())).v31.getProfile(UserProfile.email)
                .then(results => {
                    if (this._isMounted) {
                        dispatch(setProfileInfo(results));
                        this.setState({profileInfo: results});
                        localStorage.setItem('CUI', base64Svc.encode(JSON.stringify(results)));
                    }
                }).catch((err) => {				
                    ErrorHandling(err)
                });
    }

    componentDidMount() {
        microsoftTeams.initialize();
        microsoftTeams.getContext((context) => {
            if (context.subEntityId !== null && context.subEntityId !== "" && context.subEntityId !== undefined) {
                this.props.history.push('/' + context.subEntityId);
                this.setState({
                    subEntityId: context.subEntityId
                });
            }
        });
        this._isMounted = true;
        this.updateDefaultLanguage();
        if (this._isMounted) {
            this.getProfileInfo();
            this.getAchievement();
            this.getUnreadNotificationCount();
        }
        window.addEventListener("resize", this.resize.bind(this));
        this.resize();
        $("#show-sidebar").click(function () {
            $(".page-wrapper").toggleClass("toggled")
        });

        $("#toggle #do-toggle").click(function () {
            if (window.innerWidth <= 768) {
                $(".page-wrapper").toggleClass("toggled")
            }
        });

        $(document).ready(function () {
            $("body").tooltip({ selector: '[data-toggle=tooltip]' });
        });
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    updateDefaultLanguage(){
        let currentlang = localStorage.getItem("i18nextLng");
        let updateLang = getActiveLanguage(currentlang);
        i18n.changeLanguage(updateLang);
    }

    resize() {
        if (!Agent.isShowNav()) {
            $(".page-wrapper").removeClass("toggled");
            $("#show-sidebar").css('display', 'none');
        } else {
            if (window.innerWidth <= 1024) {
                $(".page-wrapper").removeClass("toggled");
            } else {
                $(".page-wrapper").addClass("toggled");
            }
        }
    }

    hello(){
        this.isLoadedFromTeams()
        this.getAchievement()    
    }

    isLoadedFromTeams() {
        const UserProfile = Storage.getProfile();;
        this.props.history.push('/profile', {email: UserProfile.email});
    }

    getAchievement() {
        const UserProfile = Storage.getProfile();;
        new Api(GetAPIHeader(Storage.getAccessToken())).v31
            .getAchievement(UserProfile.email)
            .then((results) => {
                this.setState({unlockPoints: results.UnlockPoints, levelName: results.LevelName,
                    AccumulativeEligiblePoints: results.AccumulativeEligiblePoints});
                    localStorage.setItem('AccumulativeEligiblePoints', results.AccumulativeEligiblePoints)
                localStorage.setItem('userAchivements',  JSON.stringify(results))
            })
            .catch((err) => {				
                ErrorHandling(err)
            });
    }

    getUnreadNotificationCount() {
        const { dispatch } = this.props;                
        new Api(GetAPIHeader(Storage.getAccessToken())).v31.getNotificationsStats()
            .then(response => {
                dispatch(setImportantNotificationStatus(response.Important));
                this.setState({ impCount: response.Important });
            }).catch((err) => {
                ErrorHandling(err)
            });
    }

    render() {
        const {profileInfo, AccumulativeEligiblePoints, pointsType, impCount} = this.state;
        var totalPoints =  AccumulativeEligiblePoints  ;
        var finalPointType = profileInfo !== '' && profileInfo !== null && profileInfo !== undefined ? 
                            profileInfo.PointsType : pointsType;
        const {t,location} = this.props;
        const profilePicture = store.getState().profileInfo.profileInfo.ImageUrl;
        let notificationCount = store.getState().notificationInfo.impCount;
        if(window.innerWidth <= 1024){
            $(".page-wrapper").removeClass("toggled");
        }
        const UserProfile = Storage.getProfile();
        return (
            <div>
                <div id="show-sidebar">
                    <i className="icon-ic_menu text-black pointer"></i>
                </div>
                <nav id="sidebar" className={"sidebar-wrapper"}>
                    <div className="sidebar-content" >
                        <div className="pl-4 pr-4 pt-5 pb-4 text-center pointer"
                            onClick={() => this.hello()}>
                            

                            <div>
                                {!profilePicture ? (
                                    <img alt="" src={profilePicture} name={profileInfo.FullName} width={80}
                                         className="rounded-circle"/>
                                ) : (
                                    <ImageUtils src={profilePicture} name={profileInfo.FullName}
                                                width={80} className="rounded-circle"/>
                                )
                                }
                            </div>
                            <p className="font-weight-bold text-truncate mt-2"
                                title={UserProfile.name}>{UserProfile.name}</p>
                            <p className="mt-1 mb-2">
                                <span className={"app-blue-badge-pill small bg-light-green text-green"}>
                                    {TruncateWithDynamicLen(this.state.levelName, 20)}
                                </span></p>
                            <p className="normal text-truncate text-blue font-weight-bold text-uppercase">
                                {numberWithCommas(totalPoints + " " + finalPointType)} </p>
                            <p className="small text-truncate text-uppercase text-gray">
                                {"/" + numberWithCommas(this.state.unlockPoints)} </p>
                        </div>
                        <div className="sidebar-menu" id="sidebar-menu">
                            <ul id="toggle" className="d-grid">
                                 {getIsEnabled(AllFeatures.FE_FEED) &&
                                    <div className="d-flex align-items-center justify-content-between">
                                    <NavLink to="/feed" 
                                    isActive={() => ['/', '/feed'].includes(location.pathname)}
                                     activeClassName="sidebar-link-active"
                                            className="ml-4 pt-2 pb-3 d-flex">
                                        <i className="icon-ic_home xlarge"></i>
                                        <p className="font-weight-bold normal ml-2">{t('home.home')}</p>
                                    </NavLink>
                                    <div className="d-flex">
                                        <p className="small font-weight-bold text-warning mr-2 pb-3" style={{fontSize: 8}}>NEW</p>
                                        <i className="fa fa-star text-warning mr-2" style={{fontSize: 10}} aria-hidden="true"></i>
                                    </div>
                                </div>}
                                <NavLink to="/home" activeClassName="sidebar-link-active"
                                    className="ml-4 pt-2 pb-3 d-flex">
                                    <i className="far fa-analytics d-flex align-items-center"></i>
                                    <p className="font-weight-bold normal ml-2">{t('sideNavBar.dashboard')}</p>
                                </NavLink>
                                
                                <NavLink to="/notification" activeClassName="sidebar-link-active" onClick={() => this.getUnreadNotificationCount()}
                                    className="ml-4 pt-2 pb-3 d-flex">
                                    {notificationCount > 0 && <i className="icon-Ellipse-2  x-small notification-alert-icon"></i>} 
                                    <i className="icon-ic_notification xlarge"></i>
                                    <p className="font-weight-bold normal ml-2">{t('notifications.notifications')}</p>
                                </NavLink>
                                {getIsEnabled(AllFeatures.FE_QUEST_VIEW) &&
                                    <NavLink to="/quest" activeClassName="sidebar-link-active" onClick={()=>this.getAchievement()}
                                        className="ml-4 pt-2 pb-3 d-flex">
                                        <i className="icon-ic_quest xlarge"></i>
                                        <p className="font-weight-bold normal ml-2">{t('sideNavBar.quest')}</p>
                                    </NavLink>
                                }
                                {getIsEnabled(AllFeatures.FE_FEED_POSTPOLL) &&
                                    <NavLink to="/polls" activeClassName="sidebar-link-active"
                                        className="polls-margin pt-2 pb-3 d-flex">
                                        <i className="icon-Polls-icon d-flex align-items-center "></i>
                                        <p className="font-weight-bold normal ml-2">{t('sideNavBar.polls')}</p>
                                    </NavLink>
                                }
                                {getIsEnabled(AllFeatures.FE_SURVEY_GIVE) &&
                                    <NavLink to="/survey" activeClassName="sidebar-link-active"
                                        className="polls-margin pt-2 pb-3 d-flex">
                                        <i className="icon-SurveyIcon d-flex align-items-center"></i>
                                        <p className="font-weight-bold normal ml-2">{t('sideNavBar.survey')}</p>
                                    </NavLink>}
                                {getIsEnabled(AllFeatures.FE_GOAL_CREATE_GOAL) &&
                                    <NavLink to="/goalSetting" activeClassName="sidebar-link-active"
                                             className="ml-4 pt-2 pb-3 d-flex">
                                        <i className="icon-ic_goal xlarge"></i>
                                        <p className="font-weight-bold normal ml-2">{t('sideNavBar.goalSetting')}</p>
                                    </NavLink>}                                
                                {getIsEnabled(AllFeatures.FE_POINTALLOCATION_GIVEREWARD) &&
                                    <NavLink to="/recognize" activeClassName="sidebar-link-active"
                                        className="ml-4 pt-2 pb-3 d-flex">
                                        <i className="icon-ic_Like-Thumb xlarge"></i>
                                        <p className="font-weight-bold normal ml-2">{t('sideNavBar.recognize')}</p>
                                    </NavLink>}
                                {(getIsEnabled(AllFeatures.BO_QUIZ) || (getIsEnabled(AllFeatures.FE_QUIZ) && getIsEnabled(AllFeatures.FE_QUIZ_ANSWER))) &&
                                    <NavLink to="/quiz" activeClassName="sidebar-link-active"
                                        className="ml-4 pt-2 pb-3 d-flex"
                                        onClick={() => {
                                            localStorage.removeItem('activeTab')
                                        }}>
                                        <i className="icon-ic_quiz xlarge"></i>
                                        <p className="font-weight-bold normal ml-2">{t('sideNavBar.quiz')}</p>
                                    </NavLink>
                                }
                                {getIsEnabled(AllFeatures.FE_MIB) &&
                                    <NavLink to="/mib" activeClassName="sidebar-link-active"
                                        className="ml-4 pt-2 pb-3 d-flex">
                                        <i className="icon-message-in-a-bottle xlarge"></i>
                                        <p className="font-weight-bold normal ml-2">{t('mib.menu')}</p>
                                    </NavLink>
                                }

                                {getIsEnabled(AllFeatures.FE_REDEMPTION) &&
                                    <NavLink to="/redemption" activeClassName="sidebar-link-active"
                                        className="ml-4 pt-2 pb-3 d-flex">
                                        <i className="icon-ic_reward xlarge"></i>
                                        <p className="font-weight-bold normal ml-2">{t('sideNavBar.reward')}</p>
                                    </NavLink>
                                }
                                {getIsEnabled(AllFeatures.FE_REWARD_POINTS_MYPOINTS) &&
                                    <NavLink to="/mypoints" activeClassName="sidebar-link-active" onClick={()=>this.getAchievement()}
                                        className="ml-4 pt-2 pb-3 d-flex">
                                        <i className="far fa-star" style={{ fontSize: '18px' }}></i>
                                        <p className="font-weight-bold normal ml-2">{t('quest.points')}</p>
                                    </NavLink>
                                }
                                {
                                    (getIsEnabled(AllFeatures.FE_ADHOCFEEDBACK) || getIsEnabled(AllFeatures.FE_ADHOCFEEDBACK_VIEW)) &&
                                    <NavLink to="/feedback" activeClassName="sidebar-link-active"
                                        className="ml-4 pt-2 pb-3 d-flex"
                                        onClick={() => {
                                            localStorage.removeItem('activeTab')
                                        }}>
                                        <i className="icon-Feedback-icon xlarge"></i>
                                        <p className="font-weight-bold normal ml-2">{t('feedback.feedback')}</p>
                                    </NavLink>
                                }
                                {getIsEnabled(AllFeatures.FE_REWARD_LEADERBOARD) &&
                                    ((getIsEnabled(AllFeatures.FE_REWARD_LEADERBOARD_ALLTIME) && getIsEnabled(AllFeatures.FE_REWARD_LEADERBOARD_TEAM)) ||
                                        (getIsEnabled(AllFeatures.FE_REWARD_LEADERBOARD_ALLTIME) || getIsEnabled(AllFeatures.FE_REWARD_LEADERBOARD_TEAM)) ||
                                        (getIsEnabled(AllFeatures.FE_REWARD_LEADERBOARD_TEAM) || getIsEnabled(AllFeatures.FE_REWARD_LEADERBOARD_ALLTIME))) &&
                                    <NavLink to="/leaderboard" activeClassName="sidebar-link-active" onClick={()=>this.getAchievement()}
                                        className="ml-4 pt-2 pb-3 d-flex">
                                        <i className="icon-ic_Analytics-Outline xlarge"></i>
                                        <p className="font-weight-bold normal ml-2">{t('leaderboard.leaderboard')}</p>
                                    </NavLink>
                                }
                                {(getIsEnabled(AllFeatures.BO_MANAGE_GIGS) || getIsEnabled(AllFeatures.BO_MANAGE_LOCATIONS) || getIsEnabled(AllFeatures.BO_MANAGE_PEOPLE)) &&
                                    <>
                                        <a className="pt-2 pb-3 d-flex" style={{marginLeft: '20px'}} 
                                            data-toggle="collapse" data-target="#collapseExample">
                                            <i className="icon-ic_gigs_outline xx-large ml-0 gigicon"></i>
                                            <p className="font-weight-bold normal ml-2 mt-1">{t('sideNavBar.GigArenaHeader')}</p>
                                            <i class="fas fa-chevron-down mt-1"  style={{ fontSize: '18px', marginLeft: '60px' }}></i>
                                        </a>
                                        <div class="collapse" id="collapseExample">
                                            {getIsEnabled(AllFeatures.BO_MANAGE_GIGS) &&
                                                <NavLink to="/rmdashboard" activeClassName="sidebar-link-active"
                                                    className="ml-5 mb-2 pb-2 d-flex">
                                                    <p className="font-weight-bold normal gigarena-side-menu-icons">{t('sideNavBar.rmDashboard')}</p>
                                                </NavLink>
                                            }
                                            {getIsEnabled(AllFeatures.BO_MANAGE_GIGS) &&
                                                <NavLink to="/gigs" activeClassName="sidebar-link-active"
                                                    className="ml-5 my-2 pb-2 d-flex"
                                                    onClick={() => {
                                                        localStorage.removeItem('activeTab')
                                                    }}>
                                                    <p className="font-weight-bold normal gigarena-side-menu-icons">{t('sideNavBar.gigs')}</p>
                                                </NavLink>
                                            }
                                            {getIsEnabled(AllFeatures.BO_MANAGE_LOCATIONS) &&
                                                <NavLink to="/locations" activeClassName="sidebar-link-active"
                                                    className="ml-5 my-2 pb-2 d-flex">
                                                    <p className="font-weight-bold normal gigarena-side-menu-icons">{t('sideNavBar.locations')}</p>
                                                </NavLink>
                                            }
                                            {getIsEnabled(AllFeatures.BO_MANAGE_PEOPLE) &&
                                                <NavLink to="/people" activeClassName="sidebar-link-active"
                                                    className="ml-5 my-2 pb-2 d-flex">
                                                    <p className="font-weight-bold normal gigarena-side-menu-icons">{t('sideNavBar.people')}</p>
                                                </NavLink>
                                            }
                                        </div>
                                    </>
                                }
                                {getIsEnabled(AllFeatures.FE_PLATFORM_BACKOFFICE) &&
                                    <a href={process.env.REACT_APP_ADMIN_URL}
                                        target="_blank" activeClassName="sidebar-link-active"
                                        className="ml-4 pt-2 pb-3 d-flex justify-content-between">
                                        <div className="d-flex">
                                            <i className="icon-ic_organization xlarge"></i>
                                            <p className="font-weight-bold normal ml-2">{t('sideNavBar.admin')}</p>
                                        </div>
                                        <i className="fas fa-external-link-alt mr-4 mt-2" style={{ fontSize: '12px' }}></i>
                                    </a>
                                }
                            </ul>
                        </div>
                    </div>
                </nav>
            </div>
        )
    }
}

export default withTranslation('translation')((connect())(withRouter(SideNavBar)));

