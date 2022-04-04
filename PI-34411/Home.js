import React from 'react';
import {Api} from '../../api/Api';
import GetAPIHeader from '../../api/ApiCaller';
import { withTranslation } from 'react-i18next';
import {withRouter} from 'react-router-dom';
import ImageUtils from '../../components/Utils/ImageUtils/ImageUtils';
import MorningImg from '../../assets/images/morning.png';
import AfternoonImg from '../../assets/images/afternoon.png';
import EveningImg from '../../assets/images/evening.png';
import {Base64Service} from '../../components/Services/base64';
import UserContext from '../../components/Context/UserContext';
import Modal from 'react-bootstrap/Modal';
import {
    ToastsContainer,
    ToastsContainerPosition,
    ToastsStore,
} from "react-toasts";
import {getIsEnabled, getexactTimeOrdate} from '../../constants/constants';
import {AllFeatures, Keys, ContentType } from '../../components/Services/core';
import Loading from '../../components/Loading/loading';
import './homeStyles.scss';
import StorageUtils from '../../containers/utils/StorageUtils';
import {connect} from 'react-redux';
import {setWarningPopupStatus} from '../../redux/actions/commonActions';
import ClockIcon from '../../assets/icons/ic_clock.svg';
import DownIcon from '../../assets/icons/ic_angle-down.svg';
import RedoIcon from '../../assets/icons/ic_redo.svg';
import PinIcon from '../../assets/icons/thumbtack.svg';
import DeleteIcon from '../../assets/icons/trash.svg';
import ReportIcon from '../../assets/icons/exclamation-circle.svg';
import CopyLinkIcon from '../../assets/icons/copylink.svg';
import HidePinIcon from '../../assets/icons/hidepin.svg';
import HeartIcon from '../../assets/icons/heart.svg';
import HeartFilledIcon from '../../assets/icons/heart-filled.svg';
import ShareIcon from '../../assets/icons/share-alt.svg';
import ChatCenteredIcon from '../../assets/icons/chat-centered.svg';
import ReplyIcon from '../../assets/icons/replies.svg';
import ReplyHoverIcon from '../../assets/icons/replies-hover.svg';
import PinFeedIcon from '../../assets/icons/pinfeed.svg';
import EditIcon from '../../assets/icons/editIcon.svg';
import ConfirmPopup from '../polls/PollModal';
import Carousel, { Modal as ImageModal, ModalGateway } from "react-images";
import { genKey } from 'draft-js';
import InfiniteScroll from 'react-infinite-scroller';
import NoPreviewImage from '../../assets/images/no-preview.png';
import {GetPlainText, GetUserOffset,GetUserMentions,GetEntities,GetPostType,CleanNameTag} from './CustomMatch';
import SharePost from './SharePost';
import CommentEditor from './CommentEditor';
import ReplyEditor from './ReplyEditor';
import store from "../../redux/store";
import Spinner from '../../components/Spinner/spinner';
import DocumentFeed from './DocumentFeed';
import VideoFeed from './VideoFeed';
import TextFormat from './TextFormat';
import LikedUserModal from './LikedUserModal';
import LinkPreviewFeed from './LinkPreviewFeed';
import DeleteFeedModal from './DeleteFeedModal';
import ErrorHandling from '../../api/ErrorHandling';
import moment from 'moment';
import { StorageService } from '../../components/Services/storage';

const supportedExtension = /mp4|mov|wmv|avi|mkv|flv|3gp/gi;
const Storage = new StorageUtils();
const base64Svc = new Base64Service();
const storageSvc = new StorageService();
const showFeedChar = 600;
const showCommentChar = 130;
const showReplyChar = 100;
const qs = require('qs');

class Home extends React.Component {
    static contextType = UserContext;
    constructor(props) {
        super(props);
        this.commentInput = React.createRef();
        this.sendInput = React.createRef();
        this.emojiInput = React.createRef();
        this.replyInput = React.createRef();
        this.replySendInput = React.createRef();
        this.emojiReplyInput = React.createRef();
        this.editorInput = React.createRef();
        this.playerRef = React.createRef(null);
        this.commentEditors={};
        this.replyEditors={};
        this.state={
            profileInfo: null,
            headerText: "",
            sharePostModal: false,
            submitting: false,
            postText: "",
            feeds: [],
            pinFeeds:[],
            loading: true,
            pinLoading: true,
            comment: "",
            reply: "",
            seeMoreFeedIndx:[],
            seeMoreCommentIndx:[],
            seeMoreReplyIndx:[],
            enabledCommentsIds: [],
            enabledReplyIds: {},
            selectedCommentFieldId: null,
            selectedReplyFieldId: null,
            commentsPgNo: 1,
            commentsPgSize: Number.MAX_SAFE_INTEGER,
            commentsData:[],
            deleteFeedModal: false,
            deleteCommentModal: false,
            deleteReplyModal: false,
            appreciateLoading: false,
            appreciateFeedId: null,
            loadMoreReplyIds:[],
            pinpostFeedModal: false,
            pinpostFeedId: null,
            commentsObj: {},
            commentsEditorStateObj: {},
            showUserList: false,
            allSpaces:[],
            hashtagView: false,
            uploadImages: [],
            viewPinnedFeeds: false,
            userList:[],
            imgLoading: true,
            linkPreviewData: null,
            linkPreview: false,
            peopleLikedData:[],
            pageNumber:1,
            pageSize:25,
            hideLinkPreview: {},
            editRawState: [],
            feedDataFetch: true
        }
    }
    
    getAllFeedData() {
        const {pageNumber, pageSize}=this.state;
        this.setState({hashtagView: false, feedDataFetch: false});
        this.getPinFeedPosts();
        this.getHeaderContext();
        this.getFeedPosts(pageNumber, pageSize);
        this.getAllSpaces();
    }

    componentDidMount() {
        const {dispatch,location} = this.props;
        dispatch(setWarningPopupStatus(false));
        let userSetting = JSON.parse(localStorage.getItem('UserSetting'));
        let hiddenPinFeeds = JSON.parse(localStorage.getItem('hiddenPinFeeds'));
        this.setState({
            viewPinnedFeeds: (hiddenPinFeeds === undefined || hiddenPinFeeds === null) ? userSetting.PinPost : hiddenPinFeeds
        })
        this.getProfileInfo();
        this.getAllUsers();
        if(location.search) {
            let queryParam = qs.parse(location.search, { ignoreQueryPrefix: true });  
          if(queryParam.hash) {
            this.setState({hashtagView: true});
            this.getAllSpaces(queryParam.hash);
          } else {
            this.getAllFeedData();
          }
        } else {
            this.getAllFeedData();
        }
    }

    unlisten = () => this.props.history.listen((location,action) => {
        if((location.pathname === "/feed") && !location.search  && this.state.feedDataFetch) {
            this.getAllFeedData();
        }
    });

    componentWillMount() {
        document.addEventListener("click", this.unlisten);
    }

    componentWillUnmount() {
        document.removeEventListener("click", this.unlisten);
    }

    setHashtagView = (spaceId) => {
        this.setState({
            hashtagView: true,
            feedDataFetch: true
        })
        this.getSpaceFeeds(spaceId);
    }
    handlePlayerReady = (player) => {
        this.playerRef.current = player;
    
        // you can handle player events here
        player.on('waiting', () => {
          console.log('player is waiting');
        });
    
        player.on('dispose', () => {
          console.log('player will dispose');
        });
      };

    getAllUsers() {
        this.setState({ loading: 1 });
        new Api(GetAPIHeader(Storage.getAccessToken())).v31.getUserProfile({ UnitTypeIds: [], UnitValuesIds: [] }, { Status: '1' })
        .then(response => {
            let users=[];
            response.Result.length && response.Result.map(user => {
                users.push({
                    name: user.FullName,
                    avatar: user.ImageUrl,
                    email: user.Email,
                    userId: user.UserId,
                    formattedUser: "@{" + user.FullName+":"+user.Email + "}"
                })
            })
            this.setState({userList: users, suggestions: users});
        }).catch((err) => {
            ToastsStore.error(err.Message, 3000);
            this.setState({ loading: 0 })
            ErrorHandling(err);
        });
    }

    getAllSpaces(param) {
        new Api(GetAPIHeader(Storage.getAccessToken())).v31
        .getSpaces()
        .then((response) => { 
            this.setState({
                allSpaces: response
            })
            if(param) {
                if(response.length) {
                    let space = response.find(space => (space.Name && space.Name.toLowerCase()) === (param && param.toLowerCase()));
                    this.getSpaceFeeds(space.Id);
                }
            }
        })
        .catch((err) => {
          console.log(err);
          ErrorHandling(err)
        });
    }

    getFeedCommentsData(pgNo, pgSize, feedId, pagination) {
        const {pinFeeds, feeds,commentsData}=this.state;
        new Api(GetAPIHeader(Storage.getAccessToken())).v31
        .getFeedComments(feedId, {
            pageNumber: pgNo,
            pageSize: pgSize
        })
        .then((response) => { 
            var ids = new Set(commentsData.map(d => d.Id));
            let resFilter=[]; 
            if(response.Result.length>0) {
                resFilter = response.Result.filter(d => !ids.has(d.Id));
            }
            var mergedComments = [...commentsData, ...resFilter];
            const groups = mergedComments && mergedComments.reduce((groups, comment) => {
                if (!groups[comment.FeedId]) {
                    groups[comment.FeedId] = [];
                }
                groups[comment.FeedId].push(comment);
                return groups;
            }, {});
            const groupArrays = Object.keys(groups).map((feedId) => {
                return {
                    feedId,
                    comments: groups[feedId],
                    pageSize: 2
                };
            });
            let allFeeds=[...pinFeeds, ...feeds];
            allFeeds.map((eachFeed) => {
                if(eachFeed.Id === feedId) {
                    eachFeed.FeedComments = pagination ?  response.Result : response.Result.slice(0, 2);
                    eachFeed.LoadMore = response.Result.length > 2 && !pagination
                }
            })
            this.setState({feeds: feeds, pinFeeds: pinFeeds, commentsGroupData: groups, commentsData: mergedComments, groupedCommentsData: groupArrays });
        })
        .catch((err) => {
          console.log(err);
          ErrorHandling(err)
        });
    }

    loadMoreComments(feedId) {
        const {pinFeeds, feeds, groupedCommentsData}=this.state;
        let reqComment = groupedCommentsData.find(comment => comment.feedId === feedId);
        reqComment.pageSize = reqComment.pageSize + 2;
        let allFeeds=[...pinFeeds, ...feeds];
        allFeeds.map((eachFeed) => {
            if(eachFeed.Id === feedId) {
                eachFeed.FeedComments = reqComment.comments.slice(0, reqComment.pageSize + 2);
                eachFeed.LoadMore = reqComment.comments.length >= reqComment.pageSize + 2; 
            }
        })
        this.setState({groupedCommentsData, pinFeeds: pinFeeds, feeds: feeds});
    }

    getFeedCommentReplies(feedId, commentId) {
        const {pinFeeds, feeds}=this.state;
        new Api(GetAPIHeader(Storage.getAccessToken())).v31
        .getRepliesOnComment(feedId, commentId)
        .then((response) => { 
            let allFeeds=[...pinFeeds, ...feeds];
            allFeeds.map((eachFeed) => {
                if(eachFeed.Id === feedId) {
                    if(eachFeed.FeedComments && eachFeed.FeedComments.length) {
                        let reqComment = eachFeed.FeedComments.find(o => o.Id === commentId);
                        reqComment.RepliesData = response;
                    }
                }
            })
            this.setState({feeds: feeds, pinFeeds: pinFeeds});
        })
        .catch((err) => {
          console.log(err);
          ErrorHandling(err)
        });
    }

    getProfileInfo() {
        let userInfo = localStorage.getItem('CUI');
        let decodedUser = userInfo && base64Svc.decode(userInfo);
        let userFromStorage = decodedUser && JSON.parse(decodedUser);
        let user =  userFromStorage;
        if (user) {
            this.setState({
                profileInfo: user
            })
        } 
    }

    isLoadedFromTeams() {
        const UserProfile = Storage.getProfile();;
        this.props.history.push('/profile', {email: UserProfile.email});
    }

    getFeedPosts(pgNo, pgSize, type, afterPost, pinPost) {
        new Api(GetAPIHeader(Storage.getAccessToken())).v31
        .getFeeds({
            lastFeedId: 0,
            myFeedOnly: 0,
            search_string: "",
            pageNumber:pgNo,
            pageSize:pgSize
        })
        .then((response) => {  
          let feedArr=[];
          response && response.Result.length>0 && response.Result.map((feed, feedIndex) => {
            if(feed.Images.length > 0){
                if(afterPost === true){
                    if(feedIndex === 0){
                      feed.imgLoaded = false;
                    } else {
                        feed.imgLoaded = true;
                    }
                } else {
                     feed.imgLoaded = true;
                }
            }
              if(GetPostType(feed) === "system" || feed.Type.toLocaleLowerCase() === "fun") {
                  feedArr.push(feed);
              }
          })
          let aggregatedResponse;
          if(type === "pagination") {
              aggregatedResponse=[...this.state.feeds, ...feedArr];
          } else {
              aggregatedResponse=feedArr;
          }
          this.setState({
              feeds: aggregatedResponse,
              loading: false,
              submitting: false,
              sharePostModal: false,
              hasMore: response.IsNextPage,
              pageNumber: response.PageNumber,
              postText: "",
              uploadImages: [],
          })
        })
        .catch((err) => {
          console.log(err);
          ErrorHandling(err)
        });
    }

    getPinFeedPosts() {
        new Api(GetAPIHeader(Storage.getAccessToken())).v31
        .getPinFeed({
            lastFeedId: 0,
            pageSize: 20
        })
        .then((response) => {   
          let feedArr=[];
          response && response.Result.length>0 && response.Result.map(feed => {
            feed.imgLoaded = true;
              if(GetPostType(feed) === "system" || feed.Type.toLocaleLowerCase() === "fun") {
                  feedArr.push(feed);
              }
          })
          this.setState({
              pinFeeds: feedArr,
              pinLoading: false,
              hiddenPinFeedId: feedArr.length && feedArr[0].Id
          })
        })
        .catch((err) => {
          console.log(err);
        });
    }

    getFeedPostById(feedId) {
        const {pinFeeds, feeds}=this.state;
        new Api(GetAPIHeader(Storage.getAccessToken())).v31
        .getFeed(feedId)
        .then((response) => {   
            let allFeeds=[...pinFeeds, ...feeds];
            let reqFeed = allFeeds.find(item => item.Id === feedId);
            reqFeed.Liked=response.Liked;
            reqFeed.LikeCount=response.LikeCount;
            reqFeed.CommentCount=response.CommentCount;
            reqFeed.Content=response.Content;
            reqFeed.Spaces=response.Spaces;
            reqFeed.Preview=response.Preview;
            this.setState({feeds: feeds, pinFeeds: pinFeeds, appreciateLoading: false});
        })
        .catch((err) => {
          console.log(err);
          ErrorHandling(err);
        });
    }

    feedLike(feedId) {
        this.setState({appreciateLoading: true});
        new Api(GetAPIHeader(Storage.getAccessToken())).v31
        .likeFeed(feedId)
        .then((response) => {   
          this.getFeedPostById(feedId);
        })
        .catch((err) => {
          console.log(err);
          ErrorHandling(err);
        });
    }

    feedUnLike(feedId) {
        this.setState({appreciateLoading: true});
        new Api(GetAPIHeader(Storage.getAccessToken())).v31
        .unlikeFeed(feedId)
        .then((response) => {   
          this.getFeedPostById(feedId);
        })
        .catch((err) => {
          console.log(err);
          ErrorHandling(err);
        });
    }

    onFeedLike(feedId) {
        this.setState({
            appreciateFeedId: feedId,
        }, this.feedLike(feedId));
    }

    onFeedUnLike(feedId) {
        this.setState({
            appreciateFeedId: feedId,
        }, this.feedUnLike(feedId));
    }

    getHeaderContext() {
        const {t}=this.props;
        let currentDate  = new Date();
        let hours = currentDate.getHours();
        if(hours >= 5 && hours < 12){
            this.setState({
                headerText: t('newsFeed.goodMorning'),
                bannerColor: '#EDFEFE',
                bannerIcon: MorningImg
            })
        } else if(hours >= 12 && hours < 17){
            this.setState({
                headerText: t('newsFeed.goodAfternoon'),
                bannerColor: '#ECFBFF',
                bannerIcon: AfternoonImg
            })
        } else {
            this.setState({
                headerText: t('newsFeed.goodEvening'),
                bannerColor: '#FEF7E2',
                bannerIcon: EveningImg
            })
        }
    }

    onSharePost = () => {
        this.setState({
            sharePostModal: true
        })
    }

    closeModalValues(){
        this.setState({
            sharePostModal: false, 
            postText: "",
            editPostMode: false,
            enabledCommentsIds: [],
            enabledReplyIds: [],
            editRawState: []
        })
    }

    onEditFeed(feed) {
        let rawState=this.getCustomRawState(feed.Content)
        this.setState({
            sharePostModal: true,
            editPostMode: true,
            postText: feed.Content,
            editFeedId: feed.Id,
            editMentions: GetUserMentions(feed.Content),
            editRawState: rawState,
            editFeedData: feed
        })
    }

    onExpandingcomments(feed) {
        const { enabledCommentsIds, enabledReplyIds, commentsPgNo, commentsPgSize }=this.state;
        const isExists = enabledCommentsIds.some(el => el === feed.Id);
        if(isExists) {
            const findIndx = enabledCommentsIds.findIndex(el => el === feed.Id);
            enabledCommentsIds.splice(findIndx, 1);
            delete enabledReplyIds[feed.Id];
            this.setState({
                commentFeedId: feed.Id,
                enabledCommentsIds
            })
        } else {
            enabledCommentsIds.push(feed.Id);
            this.setState({
                commentFeedId: feed.Id,
                enabledCommentsIds
            },() => {
                if(feed.CommentCount > 0) {
                    this.getFeedCommentsData(commentsPgNo, commentsPgSize, feed.Id)
                }
            })
        }
    }

    onSeeMoreClick = (feedId) => {
        const {seeMoreFeedIndx} = this.state;
        if(seeMoreFeedIndx.includes(feedId)) {
            seeMoreFeedIndx.splice(seeMoreFeedIndx.findIndex(item => item === feedId), 1);
        } else {
            seeMoreFeedIndx.push(feedId);
        }
        this.setState({seeMoreFeedIndx});
    }

    onSeeMoreCommentClick = (commentId) => {
        const {seeMoreCommentIndx} = this.state;
        if(seeMoreCommentIndx.includes(commentId)) {
            seeMoreCommentIndx.splice(seeMoreCommentIndx.findIndex(item => item === commentId), 1);
        } else {
            seeMoreCommentIndx.push(commentId);
        }
        this.setState({seeMoreCommentIndx});
    }

    onSeeMoreReplyClick = (replyId) => {
        const {seeMoreReplyIndx} = this.state;
        if(seeMoreReplyIndx.includes(replyId)) {
            seeMoreReplyIndx.splice(seeMoreReplyIndx.findIndex(item => item === replyId), 1);
        } else {
            seeMoreReplyIndx.push(replyId);
        }
        this.setState({seeMoreReplyIndx});
    }

    getSpaceFeeds(spaceId) {
        this.setState({loading: true});
        new Api(GetAPIHeader(Storage.getAccessToken())).v31.getSpaceFeeds(spaceId, {lastFeedId: 0})
        .then(response => {
            this.setState({
                feeds: response.Result,
                loading: false,
                pinLoading: false,
                hasMore: false
            });

        }).catch((err) => {
            ToastsStore.error(err.Message, 3000);
            this.setState({ loading: 0 })
        });
    }

    renderReplyCount(count) {
        const {t}=this.props;
        if(count) {
            return count > 1 ? count + " " + t('newsFeed.replies') : count + " " + t('newsFeed.reply');
        } else {
            return t('newsFeed.reply');
        }
    }

    renderLikeCount(count) {
        const {t}=this.props;
        if(count) {
            return count > 1 ? count + " " + t('newsFeed.likes') : count + " " + t('newsFeed.like');
        } else {
            return t('newsFeed.like');
        }
    }

    onReplyComment(feed, comment) {
        const { enabledReplyIds }=this.state;
        if(enabledReplyIds[feed.Id] === comment.Id) {
            delete enabledReplyIds[feed.Id]
            this.setState({enabledReplyIds});
        } else {
            enabledReplyIds[feed.Id]=comment.Id;
            this.setState({
                commentReplyId: comment.Id,
                enabledReplyIds
            }, () => {
                if(comment.RepliesCount > 0) {
                    this.getFeedCommentReplies(feed.Id, comment.Id);
                }
            })
        }
    }

    shrinkReplySection = (id) => {
        const { enabledReplyIds }=this.state;
        delete enabledReplyIds[id];
    }

    getFeedCommentById(feedId, commentId) {
        const {pinFeeds, feeds}=this.state;
        new Api(GetAPIHeader(Storage.getAccessToken())).v31
        .getFeedComment(feedId, commentId)
        .then((response) => {   
            let allFeeds=[...pinFeeds, ...feeds];
            let reqFeed = allFeeds.find(item => item.Id === feedId);
            let reqComment = reqFeed.FeedComments.find(item => item.Id === commentId);
            reqComment.LikeCount=response.LikeCount;
            reqComment.Liked=response.Liked;
            reqComment.RepliesCount=response.RepliesCount;
            this.setState({pinFeeds: pinFeeds, feeds: feeds});
            this.getFeedCommentReplies(feedId, commentId);
        })
        .catch((err) => {
          console.log(err);
        });
    }

    onLikeComment(feedId, commentId) {
        new Api(GetAPIHeader(Storage.getAccessToken())).v31
        .likeComment(feedId, commentId)
        .then((response) => {   
            this.getFeedCommentById(feedId, commentId);
        })
        .catch((err) => {
          console.log(err);
        });   
    }

    onUnLikeComment(feedId, commentId) {
        new Api(GetAPIHeader(Storage.getAccessToken())).v31
        .unlikeComment(feedId, commentId)
        .then((response) => {   
            this.getFeedCommentById(feedId, commentId);
        })
        .catch((err) => {
          console.log(err);
        });   
    }

    onPinpostFeed(feedId) {
        this.setState({
            pinpostFeedModal: true,
            pinpostFeedId: feedId
        })
    }

    onHidePinFeed(feedId) {
        this.setState({hiddenPinFeedId: feedId});
        new Api(GetAPIHeader(Storage.getAccessToken())).v31
        .hidePinPost({id: feedId, hidePost: true})
        .then((response) => {   
            localStorage.setItem('hiddenPinFeeds', true);
            this.setState({viewPinnedFeeds: true});         
        })
        .catch((err) => {
          console.log(err);
        });
    }

    closePinpostFeedModal = () => {
        this.setState({
            pinpostFeedModal: false,
            pinpostFeedId: null
        })
    }

    onUnpinpostFeed(feedId) {
        this.setState({
            unpinpostFeedModal: true,
            unpinpostFeedId: feedId
        })
    }

    closeUnpinpostFeedModal = () => {
        this.setState({
            unpinpostFeedModal: false,
            unpinpostFeedId: null
        })
    }

    onReportPostFeed(feedId) {
        this.setState({
            reportPostModal: true,
            reportPostFeedId: feedId
        })
    }

    closeReportPostFeedModal = () => {
        this.setState({
            reportPostModal: false,
            reportPostFeedId: null
        })
    }

    onDeleteFeed(feedId) {
        this.setState({
            deleteFeedModal: true,
            deleteFeedId: feedId
        })
    }

    closeFeedDeleteModal = () => {
        this.setState({
            deleteFeedModal: false,
            deleteFeedId: null
        })
    }

    pinpostFeedClick = () => {
        const {pinpostFeedId, pageSize}=this.state;
        this.setState({pinningFeed: true});
        new Api(GetAPIHeader(Storage.getAccessToken())).v31
        .pinPost(pinpostFeedId, {pinpost: 1})
        .then((response) => {   
            document.body.scrollTop = document.documentElement.scrollTop = 0;
            this.getPinFeedPosts();
            this.getFeedPosts(1, pageSize, "", false, true);
            this.setState({pinningFeed: false, pinpostFeedModal: false, pinpostFeedId: null});
        })
        .catch((err) => {
          console.log(err);
          this.setState({pinningFeed: false, pinpostFeedModal: false});
          let errorMessage = err.Message;
            if(errorMessage != null && errorMessage !== "" && errorMessage !== undefined) {
                ToastsStore.error(errorMessage);
            }
        });
    }

    unpinpostFeedClick = () => {
        const {unpinpostFeedId, pageSize}=this.state;
        this.setState({unpinningFeed: true});
        new Api(GetAPIHeader(Storage.getAccessToken())).v31
        .pinPost(unpinpostFeedId, {pinpost: 0})
        .then((response) => {   
          this.getPinFeedPosts();
          this.getFeedPosts(1, pageSize, "", false, true);
          this.setState({unpinningFeed: false, unpinpostFeedModal: false,unpinpostFeedId: null});
        })
        .catch((err) => {
          console.log(err);
          this.setState({unpinningFeed: false,unpinpostFeedModal: false, unpinpostFeedId: null});
          let errorMessage = err.Message;
            if(errorMessage != null && errorMessage !== "" && errorMessage !== undefined) {
                ToastsStore.error(errorMessage);
            }
        });
    }

    reportPostFeedClick = () => {
        const {t}=this.props;
        const {reportPostFeedId,feeds, pinFeeds}=this.state;
        this.setState({reportingFeed: true});
        new Api(GetAPIHeader(Storage.getAccessToken())).v31
        .reportFeed(reportPostFeedId)
        .then((response) => {   
          ToastsStore.success(t('newsFeed.reportFeedSuccMsg'), 2000);
            if(feeds.findIndex(item => item.Id === reportPostFeedId) > -1) {
                feeds.splice(feeds.findIndex(item => item.Id === reportPostFeedId), 1);
            } else if(feeds.findIndex(item => item.Id === reportPostFeedId) > -1) {
                pinFeeds.splice(feeds.findIndex(item => item.Id === reportPostFeedId), 1);
            }
          this.setState({reportingFeed: false, reportPostModal: false, reportPostFeedId: null, feeds: feeds, pinFeeds: pinFeeds});
        })
        .catch((err) => {
          console.log(err);
          this.setState({reportingFeed: false, reportPostModal: false, reportPostFeedId: null});
          let errorMessage = err.Message;
            if(errorMessage != null && errorMessage !== "" && errorMessage !== undefined) {
                ToastsStore.error(errorMessage);
            }
        });
    }

    deleteFeedClick = () => {
        const {t}=this.props;
        const {deleteFeedId, feeds, pinFeeds}=this.state;
        this.setState({deletingFeed: true});
        new Api(GetAPIHeader(Storage.getAccessToken())).v31
        .deleteFeed(deleteFeedId)
        .then((response) => {   
          ToastsStore.success(t('newsFeed.feedDeletedMsg'), 2000);
          const pinFeedfindIndx = pinFeeds.findIndex(el => el.Id === deleteFeedId);
          pinFeedfindIndx>-1 && pinFeeds.splice(pinFeedfindIndx, 1);
          const feedfindIndx = feeds.findIndex(el => el.Id === deleteFeedId);
          feedfindIndx>-1 && feeds.splice(feedfindIndx, 1);
          this.setState({deleteFeedModal: false, deletingFeed: false, pinFeeds: pinFeeds, feeds: feeds});
        })
        .catch((err) => {
          console.log(err);
          this.setState({deletingFeed: false});
          let errorMessage = err.Message;
            if(errorMessage != null && errorMessage !== "" && errorMessage !== undefined) {
                ToastsStore.error(errorMessage);
            }
        });
    }

    deleteCommentClick = () => {
        const {t}=this.props;
        const {deleteCommentFeedId, deletecommentId, feeds, enabledCommentsIds, commentsPgNo, commentsPgSize}=this.state;
        this.setState({deletingComment: true});
        new Api(GetAPIHeader(Storage.getAccessToken())).v31
        .deleteComment(deleteCommentFeedId, deletecommentId)
        .then((response) => {   
          ToastsStore.success(t('newsFeed.commentDeletedMsg'), 2000);
        //   enabledCommentsIds.splice(enabledCommentsIds.findIndex(el => el === deleteCommentFeedId), 1);
          this.getFeedPostById(deleteCommentFeedId);
          this.setState({
              deleteCommentModal: false, 
              deletingComment: false, 
              feeds: feeds, 
              enabledCommentsIds},this.getFeedCommentsData.bind(this, commentsPgNo, commentsPgSize, deleteCommentFeedId));
        })
        .catch((err) => {
          console.log(err);
          this.setState({deletingComment: false});
          let errorMessage = err.Message;
            if(errorMessage != null && errorMessage !== "" && errorMessage !== undefined) {
                ToastsStore.error(errorMessage);
            }
        });
    }

    renderReportPost() {
        const {t}=this.props;
        const {reportPostModal, reportingFeed}=this.state;
        if(reportPostModal) {
            return( 
                <ConfirmPopup  
                    show={reportPostModal} 
                    header={t('newsFeed.reportpostFeedMsg')}
                    handleClose={this.closeReportPostFeedModal}
                    loading={reportingFeed}
                    btnText={t('common.yes')}
                    cancelText={t('common.no')}
                    onConfirm={this.reportPostFeedClick} 
                />
            )
        } else return;
    }

    renderPinpostFeedModal() {
        const {t}=this.props;
        const {pinpostFeedModal, pinningFeed}=this.state;
        if(pinpostFeedModal) {
            return( 
                <ConfirmPopup  
                    show={pinpostFeedModal} 
                    header={t('newsFeed.pinpostFeedMsg')}
                    handleClose={this.closePinpostFeedModal}
                    loading={pinningFeed}
                    btnText={t('common.yes')}
                    cancelText={t('common.no')}
                    onConfirm={this.pinpostFeedClick} 
                />
            )
        } else return;
    }

    renderUnpinpostFeedModal() {
        const {t}=this.props;
        const {unpinpostFeedModal, unpinningFeed}=this.state;
        if(unpinpostFeedModal) {
            return( 
                <ConfirmPopup  
                    show={unpinpostFeedModal} 
                    header={t('newsFeed.unpinpostFeedMsg')}
                    handleClose={this.closeUnpinpostFeedModal}
                    loading={unpinningFeed}
                    btnText={t('common.yes')}
                    cancelText={t('common.no')}
                    onConfirm={this.unpinpostFeedClick} 
                />
            )
        } else return;
    }

    renderFeedDeleteModal() {
        const {deleteFeedModal, deletingFeed}=this.state;
        if(deleteFeedModal) {
            return( 
                <DeleteFeedModal 
                    show={deleteFeedModal}
                    onClick={this.deleteFeedClick}
                    closeModal={this.closeFeedDeleteModal}
                    loading={deletingFeed}
                />
            )
        } else return;
    }

    renderCommentDeleteModal() {
        const {t}=this.props;
        const {deleteCommentModal, deletingComment}=this.state;
        if(deleteCommentModal) {
            return( 
                <ConfirmPopup  
                    show={deleteCommentModal} 
                    header={t('newsFeed.commentDeleteConfirmationMsg')}
                    handleClose={this.closeCommentDeleteModal}
                    loading={deletingComment}
                    btnText={t('common.confirm')}
                    cancelText={t('common.cancel')}
                    onConfirm={this.deleteCommentClick} 
                />
            )
        } else return;
    }

    renderReplyDeleteModal() {
        const {t}=this.props;
        const {deleteReplyModal, deletingReply}=this.state;
        if(deleteReplyModal) {
            return( 
                <ConfirmPopup  
                    show={deleteReplyModal} 
                    header={t('newsFeed.replyDeleteConfirmationMsg')}
                    handleClose={this.closeReplyDeleteModal}
                    loading={deletingReply}
                    btnText={t('common.confirm')}
                    cancelText={t('common.cancel')}
                    onConfirm={this.deleteReplyClick} 
                />
            )
        } else return;
    }

    deleteReplyClick = () => {
        const {deleteReplyFeedId, deleteReplyCommentId, deleteReplyId, commentsPgNo, commentsPgSize}=this.state;
        const {t}=this.props;
        this.setState({deletingReply: true});
        new Api(GetAPIHeader(Storage.getAccessToken())).v31
        .deleteReplyOnComment(deleteReplyFeedId, deleteReplyCommentId, deleteReplyId)
        .then((response) => {   
          ToastsStore.success(t('newsFeed.replyDeletedMsg'), 2000);
          this.getFeedCommentReplies(deleteReplyFeedId, deleteReplyCommentId);
          this.getFeedCommentsData(commentsPgNo, commentsPgSize, deleteReplyFeedId);
          this.setState({deletingReply: false, deleteReplyModal: false});
        })
        .catch((err) => {
          console.log(err);
          this.setState({deletingReply: false});
          let errorMessage = err.Message;
            if(errorMessage != null && errorMessage !== "" && errorMessage !== undefined) {
                ToastsStore.error(errorMessage);
            }
        });
    }

    onDeleteCommentReply(feedId, commentId, replyId) {
        this.setState({
            deleteReplyModal: true,
            deleteReplyFeedId: feedId,
            deleteReplyCommentId: commentId,
            deleteReplyId: replyId
        })
    }

    closeReplyDeleteModal = () => {
        this.setState({
            deleteReplyModal: false,
            deleteReplyFeedId: null,
            deleteReplyCommentId: null,
            deleteReplyId: null
        })
    }

    likePeopleComment(feed, comment) {
        if(comment.LikeCount>0) {
            this.onShowingPeopleLikedComment(feed, comment);
        } else {
            this.onLikeComment(feed.Id, comment.Id);
        }
    }

    renderFeedComments(feed) {
        const {t}=this.props;
        const {enabledCommentsIds, profileInfo, seeMoreCommentIndx, enabledReplyIds, commentsGroupData}=this.state;
        if(!enabledCommentsIds.includes(feed.Id)) {
            return
        }
        return feed.FeedComments && feed.FeedComments.length ? feed.FeedComments.map((eachComment, idx) => {
                    if(!eachComment) {
                        return null;
                    } 
                    return (
                    <div className="bg-white" key={idx}>
                        <div className="pt-2">
                            <div className="h-line" />
                        </div>
                        <div className="row d-flex align-items-start pt-3 pl-1 ml-n3 mr-n3">
                            <div className="col-12">
                                <div className="d-flex pointer"
                                onClick={()=>{
                                    this.props.history.push('/profile', {email: eachComment.Email});
                                }}>
                                    <ImageUtils 
                                        src={eachComment.UserImageUrl} 
                                        name={eachComment.FullName}
                                        width={40} className="rounded-circle"
                                    />
                                    <div className="pl-3">
                                        <p className="font-weight-bold normal text-dark-gray">{eachComment.FullName}{feed.CreatedBy === eachComment.CreatedBy && <span className="auth-txt ml-2">{t('newsFeed.author')}</span>}</p>
                                        <p className="pt-2 normal text-dark-gray desc_text font-weight-normal pre-wrap">   
                                            <TextFormat 
                                                content={eachComment.Content} 
                                                id={eachComment.Id}
                                                showChar={showCommentChar} 
                                                seeMoreIndx={seeMoreCommentIndx} 
                                                type="comment" 
                                            />
                                        </p>
                                            {(eachComment.Content.length > showCommentChar) &&
                                            <div className="row justify-content-end"> 
                                                <div className="float-right pr-4">
                                                        <p className="pl-2 normal text-light-gray font-weight-bold pointer"
                                                           onClick={() => this.onSeeMoreCommentClick(eachComment.Id)}>
                                                            {seeMoreCommentIndx.includes(eachComment.Id) ? null : t('newsFeed.seeMore')}
                                                        </p>
                                                </div>
                                            </div>}
                                    </div>
                                </div>
                            </div>
                            <div className="pl-1 position-absolute" style={{right:30}}>
                                {eachComment.CreatedBy  === profileInfo.UserId &&
                                    <div className="dropdown dropleft">
                                        <span className="float-right"
                                            role="button" id="dropdownMenuLink"
                                            data-toggle="dropdown"
                                            aria-haspopup="true"
                                            aria-expanded="false">
                                            <i className="icon-pencil-alt fa-lg text-gray pointer" />
                                        </span>
                    
                                        <div className="dropdown-menu"
                                            aria-labelledby="dropdownMenuLink">
                                            <span className="dropdown-item pointer small text-dark-gray font-weight-normal"
                                             onClick={() => this.onDeleteComment(feed.Id, eachComment.Id)}><img className="mr-2" width="14" height="14" alt="" src={DeleteIcon} />{t('common.delete')}</span>
                                        </div>
                                </div>}
                            </div>
                        </div>
                        <div className="row pt-3">
                            <div className="col-md-11 offset-md-1 d-flex">
                                <p className="pl-2 small font-weight-normal" style={{color: "#B5BBC1"}}>{getexactTimeOrdate(eachComment.DateCreated)}</p>
                                {eachComment.Liked ?
                                <div className="d-flex align-items-center pl-2">
                                    <img src={HeartFilledIcon} className="pointer" alt="" onClick={() => this.onUnLikeComment(feed.Id, eachComment.Id)} />
                                    <p className="pl-2 font-weight-normal small pointer" style={{color:"#0757D7"}} onClick={() => this.onShowingPeopleLikedComment(feed, eachComment)}>
                                        {this.renderLikeCount(eachComment.LikeCount)}
                                    </p>
                                </div> :
                                <div className="d-flex align-items-center pl-2">
                                    <img src={HeartIcon} className="pointer" alt="" onClick={() => this.onLikeComment(feed.Id, eachComment.Id)} />
                                    <p className="pl-2 text-light-gray font-weight-normal small pointer" onClick={() => this.likePeopleComment(feed, eachComment)}>
                                        {this.renderLikeCount(eachComment.LikeCount)}
                                    </p>
                                </div>}
                                {enabledReplyIds[feed.Id] === eachComment.Id ?
                                <div className="d-flex align-items-center pl-3 pointer" 
                                    onClick={() => this.onReplyComment(feed, eachComment)}>
                                    <img src={ReplyHoverIcon} className="pointer" alt="" />
                                    <p className="pl-2 font-weight-normal small" style={{color:"#0757D7"}}>
                                        {this.renderReplyCount(eachComment.RepliesCount)}
                                    </p>
                                </div> :
                                <div className="d-flex align-items-center pl-3 pointer" 
                                onClick={() => this.onReplyComment(feed, eachComment)}>
                                    <img src={ReplyIcon} className="pointer" alt="" />
                                    <p className="pl-2 text-light-gray font-weight-normal small">
                                        {this.renderReplyCount(eachComment.RepliesCount)}
                                    </p>
                                </div>}
                              </div>
                            </div>
                            {this.renderCommentReplies(feed, eachComment)}
                            {this.renderReplyInputField(feed, eachComment)}
                            {idx === feed.FeedComments.length-1 && commentsGroupData && commentsGroupData[feed.Id] && commentsGroupData[feed.Id].length > 2 && feed.LoadMore && 
                             <div className="pt-2 pb-2 ml-n3 mr-n3 mb-n3" style={{borderRadius: "0px 0px 8px 8px"}}>
                                <div className="h-line" />
                                <div className="d-flex align-items-center pl-3">
                                    <p className="small pt-2 pointer" style={{color: "#666666"}} onClick={() => this.loadMoreComments(feed.Id)}>{t('newsFeed.loadMoreComments')}</p>
                                    <i className="icon-ic_redo pt-2 ml-1 pointer requirement" style={{fontSize:10}} onClick={() => this.loadMoreComments(feed.Id)} />
                                </div>
                            </div>}
                        </div>
                    )
                }) : null;
    }

    loadMoreReplies(id, expandFlag) {
        const {loadMoreReplyIds}=this.state;
        const isExists = loadMoreReplyIds.some(el => el === id);
        if(isExists && !expandFlag) {
            const findIndx = loadMoreReplyIds.findIndex(el => el === id);
            loadMoreReplyIds.splice(findIndx, 1);
            this.setState({
                loadMoreReplyIds
            })
        } else {
            loadMoreReplyIds.push(id);
            this.setState({
                loadMoreReplyIds
            })
        }
    }

    renderCommentReplies(feed, comment) {
        const {t}=this.props;
        let { enabledReplyIds, commentReplyId, seeMoreReplyIndx, loadMoreReplyIds, profileInfo}=this.state;
        if(enabledReplyIds[feed.Id] !== comment.Id) {
            return null;
        }
        let repliesForComment = comment.RepliesData;
        if(repliesForComment && repliesForComment.length) {
            let commentReplies = loadMoreReplyIds.includes(commentReplyId) ? repliesForComment : repliesForComment && repliesForComment.slice(0,1);
            return commentReplies && commentReplies.length ? commentReplies.map((eachReply,idx) => {
                    return (
                        <div key={eachReply.Id}>
                            <div className="pt-2 pb-2 ml-n2 mr-n2" style={{background: "#FDFDFD"}}>
                                <div className="line" />
                            </div>
                            <div className="row d-flex align-items-start pt-2" style={{background: "#FDFDFD"}}>
                                <div className="col-11 col-md-11 col-lg-11 col-sm-11 col-xl-11 offset-md-1">
                                    <div className="d-flex ml-2 pointer"
                                    onClick={()=>{
                                                    this.props.history.push('/profile', {email: eachReply.Email});
                                                }}>
                                        <ImageUtils 
                                            src={eachReply.ImageUrl} 
                                            name={eachReply.FullName}
                                            width={32} className="rounded-circle"
                                        />
                                        <div className="pl-3">
                                            <p className="font-weight-bold normal text-dark-gray">{eachReply.FullName}{feed.CreatedBy === eachReply.CreatedBy && <span className="auth-txt ml-2">{t('newsFeed.author')}</span>}</p>
                                            <p className="pt-2 text-dark-gray font-weight-normal" style={{whiteSpace: "pre-wrap", fontSize: 12}}>
                                                <TextFormat 
                                                    content={eachReply.Content} 
                                                    id={eachReply.Id}
                                                    showChar={showReplyChar} 
                                                    seeMoreIndx={seeMoreReplyIndx} 
                                                    type="reply" 
                                                />
                                            </p>
                                            <p className="font-weight-normal small text-light-gray pt-2">{getexactTimeOrdate(eachReply.CreatedTime)}</p>
                                            {(eachReply.Content.length > showReplyChar) &&
                                                 <div className="row justify-content-end"> 
                                                   <div className="float-right pr-4">
                                                        <p className="pl-2 small text-light-gray font-weight-bold pointer"
                                                           onClick={() => this.onSeeMoreReplyClick(eachReply.Id)}>
                                                             {seeMoreReplyIndx.includes(eachReply.Id) ? null : t('newsFeed.seeMore')}
                                                        </p>
                                                   </div>
                                                </div>}
                                        </div>
                                    </div>
                                </div>
                                {(eachReply.CreatedBy === (profileInfo && profileInfo.UserId)) &&
                                    <div className="pl-1 position-absolute" style={{right:30}}>
                                    <div className="dropdown dropleft">
                                        <span className="float-right"
                                            role="button" id="dropdownMenuLink"
                                            data-toggle="dropdown"
                                            aria-haspopup="true"
                                            aria-expanded="false">
                                            <i className="icon-pencil-alt fa-lg text-gray pointer" />
                                        </span>
                                        <div className="dropdown-menu"
                                            aria-labelledby="dropdownMenuLink">
                                            <span className="dropdown-item pointer small text-dark-gray font-weight-normal"
                                             onClick={() => this.onDeleteCommentReply(feed.Id, commentReplyId, eachReply.Id)}><img className="mr-2" width="14" height="14" alt="" src={DeleteIcon} />{t('common.delete')}</span>
                                        </div>
                                    </div>
                                </div>}
                                {idx === commentReplies.length-1 && !loadMoreReplyIds.includes(commentReplyId) && repliesForComment.length>1 &&
                                 <div className="col-10 col-md-10 col-lg-10 col-sm-10 col-xl-10 offset-md-1">
                                    <div className="d-flex align-items-center pl-3">
                                        <p className="small pt-2 pointer" style={{color: "#666666"}} onClick={() => this.loadMoreReplies(commentReplyId, true)}>{t('newsFeed.loadMoreReplies')}</p>
                                        <i className="icon-ic_redo pt-2 ml-1 pointer requirement" style={{fontSize:10}} onClick={() => this.loadMoreReplies(commentReplyId, true)} />
                                    </div>
                                </div>}
                            </div>
                        </div>
                        )
                }) : null;
      } else {
          return null;
      }
    }

    renderReplyInputField(feed, comment) {        
        const { enabledReplyIds, profileInfo }=this.state;
        const profilePicture = store.getState().profileInfo.profileInfo.ImageUrl;
        if(enabledReplyIds[feed.Id] !== comment.Id) {
            return
        }
        return ( 
            <div>
                <div className="pt-2 pb-2 ml-n2 mr-n2" style={{background: "#FDFDFD"}}>
                    <div className="line" />
                </div>
                <div className="row pt-2" style={{background: "#FDFDFD"}}>
                <div className="col-md-11 col-lg-11 col-sm-11 col-xl-11 offset-md-1 offset-lg-1 offset-sm-1 offset-xl-1">
                    <div className="d-flex align-items-center ml-2">
                        <ImageUtils 
                            src={profilePicture}
                            name={profileInfo && profileInfo.FullName}
                            width={32} className="rounded-circle"
                        />
                        {<ReplyEditor feed={feed} comment={comment} userList={this.state.userList}
                            getFeedCommentReplies={this.getFeedCommentReplies.bind(this)} loadMoreReplies={this.loadMoreReplies.bind(this)}
                            getFeedCommentById={this.getFeedCommentById.bind(this)} editPostMode={this.state.editPostMode} editMentions={this.state.editMentions}
                        />}
                    </div>
                </div>
                </div>
            </div>
        )
    }

    renderLikeIcon(feed) {
        if(feed.Liked) {
            return (
                <div className="d-flex align-items-center justify-content-center ml-n4 pointer" onClick={() => this.onFeedUnLike(feed.Id)}>
                    <img src={HeartFilledIcon} alt="" />
                </div>
            )
        } else {
            return (
                <div className="d-flex align-items-center justify-content-center ml-n4 pointer" onClick={() => this.onFeedLike(feed.Id)}>
                    <img src={HeartIcon} alt="" />
                </div>
            )
        }
    }

    clickFeedLike(feed) {
        if(feed.Liked || feed.LikeCount > 0) {
            this.onShowingPeopleLiked(feed);
        } else {
            this.onFeedLike(feed.Id);
        }
    }

    onDeleteComment(feedId, commentId) {
        this.setState({
            deleteCommentModal: true,
            deleteCommentFeedId: feedId,
            deletecommentId: commentId
        })
    }

    closeCommentDeleteModal = () => {
        this.setState({
            deleteCommentModal: false,
            deleteCommentFeedId: null,
            deletecommentId: null
        })
    }

    renderHeaderBanner() {
      const {t}=this.props;
      const { profileInfo, headerText, bannerColor, bannerIcon } = this.state;
        return (
            <div className="home_card mb-3">
                <div className="d-flex align-items-end justify-content-between p-3"  
                    style={{background : bannerColor, margin: -16, borderRadius: "8px 8px 0px 0px" }}>
                    <div>
                        <ImageUtils 
                            src={profileInfo && profileInfo.ImageUrl} 
                            name={profileInfo && profileInfo.FullName}
                            width={80} className="rounded-circle"
                        />
                        <p className="xx-large mt-2">{t('newsFeed.wcMsg')}<span className="text-capitalize">{profileInfo && profileInfo.FullName}</span></p>
                        <p className="h1 text-black">{headerText}</p>
                    </div>

                    <div>
                        <img src={bannerIcon} width={140} alt="" />
                    </div>
                </div>
                {getIsEnabled(AllFeatures.FE_FEED_POSTFEED) &&
                    <div className="pt-4">
                        <p className="normal text-dark-gray font-weight-bold">{t('newsFeed.createPost')}</p>
                        <div className="row d-flex align-items-center pt-2">
                            <div className="col-12 col-md-12 col-lg-12 col-xl-12">
                                <div className="p-2 border border-light-gray py-2 rounded pointer" onClick={this.onSharePost}>
                                    <p className="small text-left">{t('newsFeed.sharePostPlaceholder')}</p>
                                </div> 
                            </div> 
                        </div>
                    </div>}
            </div>
        )
    }

    renderHashtagBanner() {
      const {t}=this.props;
      const { profileInfo } = this.state;
      let queryParam = this.props.location.search && qs.parse(this.props.location.search, { ignoreQueryPrefix: true });            
        return (
            <div className="home_card mb-3">
               <div className="d-flex align-items-end justify-content-between p-3"  
                    style={{background : "#F2F7FF", margin: -16, borderRadius: "8px 8px 0px 0px" }}>
                    <div>
                        <p className="xlarge font-weight-normal mt-2">{t('newsFeed.wcMsg')}<span className="text-capitalize">{profileInfo && profileInfo.FullName + "."}</span><span className="ml-2">{t('newsFeed.hashtagHeader')}</span></p>
                        <p className="font-weight-bold mt-2" style={{fontSize: 38}}>{"#"+queryParam.hash}</p>
                    </div>
                </div>
            </div>
        )
    }

    onUnHideFeed = () => {
        const {hiddenPinFeedId}=this.state
        new Api(GetAPIHeader(Storage.getAccessToken())).v31
        .hidePinPost({id: hiddenPinFeedId, hidePost: false})
        .then((response) => {  
            localStorage.setItem('hiddenPinFeeds', false);
            this.setState({viewPinnedFeeds: false});         
        })
        .catch((err) => {
          console.log(err);
        });
    }

    renderViewPinnedPost() {
        const {t}=this.props;
        const {pinFeeds,viewPinnedFeeds}=this.state;
        if(viewPinnedFeeds && pinFeeds.length) {
            return (
                <div className="app-card mb-3 pointer" onClick={this.onUnHideFeed}>
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                            <img className="mr-2" width="14" height="14" alt="" src={PinFeedIcon} /> 
                            <p className="normal text-black font-weight-bold">{t('newsFeed.viewPinnedPost')}</p>
                        </div>
                        <p className="badge badge-pill badge-primary">{pinFeeds.length}</p>
                    </div>
                </div>
            )
        } else return;
    }

    getBlocks(str) {
        let arr=[];
        str.forEach(item => {
            arr.push({
                  key: genKey(),
                  text: GetPlainText(item) ,
                  type: "unstyled",
                  depth: 0,
                  inlineStyleRanges: [],
                  entityRanges: GetUserOffset(item),
                  data: {}
                })
        })
        return arr;
    }

    getCustomRawState(content) {
        let str = content.split("\n");
        let rawState = {
            blocks: this.getBlocks(str),
            entityMap: GetEntities(GetUserMentions(content))
        }
        return rawState;
    }

    openLightbox = (idx, feedId) => {
        this.setState({
            viewerIsOpenFeedId: feedId,
            currentImage: idx
        })
    }

    closeLightbox = () => {
        this.setState({
            viewerIsOpenFeedId: null,
            currentImage: 0
        })
    }

    renderUrlPreview(feed) {
        return <LinkPreviewFeed feed={feed} />;
    }

    renderPostContent(feed) {
        if(GetPostType(feed) === "photos" || GetPostType(feed) === "photoswithurl") {
            return this.renderFeedImages(feed);
        } else if(GetPostType(feed) === "url") {
            return this.renderUrlPreview(feed);
        } else if(GetPostType(feed) === "document" || GetPostType(feed) === "documentwithurl") {
            return this.renderDocument(feed);
        } else if(GetPostType(feed) === "video") {
            return this.renderVideo(feed);
        } else {
            return
        }
    }

    onImageLoading(imgs) {
        this.setState({ imgLoading: false})
    }

    renderDocument(feed){
        return <DocumentFeed feed={feed} />;
    }

    addViewCount = () => {

    }

    renderVideo(feed){
        let isSupportedExtension = feed.Images[0].toLowerCase().search(supportedExtension) > -1;
        if(isSupportedExtension) {
            return <VideoFeed feed={feed} playing={this.addViewCount} />;
        } else {
            return null;
        }
    }

    renderFeedImages(feed) {
        const {viewerIsOpenFeedId, currentImage}=this.state;
        let feedImages=[];
        feed.Images && feed.Images.length && feed.Images.map((img, idx) => {
            feedImages.push({
                src: img,
                width:idx === 0 ? 3 : 1,
                height:idx === 0 ? 4 : 1
            })
        })

        if(feedImages.length>0) {
            let topImgs = feedImages.slice(0,6);
            let remainingImages = feedImages.length - 5;

            return (
                <div>
                    <div className={'image-grid ' + (topImgs.length === 1 ? 'image-grid-1' : 
                    (topImgs.length === 2 || topImgs.length === 4) ? 'image-grid-2' : 
                    topImgs.length === 3 && 'image-grid-3')}>
                    {topImgs.map((item, idx) => {
                        return (
                            <>
                                {idx < 5 &&
                                <>
                                {!feed.imgLoaded && idx === 0 &&
                                <div className='d-flex justify-content-center'>
                                    <Loading Height="0" imgLoaded={true}/>
                                </div>
                                }
                                <img alt="" 
                                    onLoad={()=>{
                                        feed.imgLoaded = true 
                                        this.setState({imgLoaded: true})
                                    }}
                                    className={"pointer mb-2 " +(topImgs.length > 4 && idx === 0 && 'image-grid-col-2 image-grid-row-2')} 
                                    src={item.src} onClick={() => this.openLightbox(idx, feed.Id)} />
                                </>

                                }
                                {topImgs.length > 5 && idx === topImgs.length-1 &&  
                                <p className="position-icon text-white xx-large">{'+' + remainingImages}</p>} 
                            </>
                         )
                        })}

                    </div>
                    <ModalGateway>
                        {viewerIsOpenFeedId === feed.Id ? (
                        <ImageModal onClose={this.closeLightbox}>
                            <Carousel
                                currentIndex={currentImage}
                                views={feedImages.map(x => ({
                                    ...x,
                                    srcset: x.srcSet,
                                    caption: x.title
                                }))}
                            />
                        </ImageModal>
                        ) : null}
                    </ModalGateway>
                </div>
            )
        } else return; 
    }

    getPeopleLiked(feedId) {
        new Api(GetAPIHeader(Storage.getAccessToken())).v31.getFeedLikes(feedId)
        .then(response => {
            this.setState({fetchingPeopleLiked: false, peopleLikedData: response});
        }).catch((err) => {
            this.setState({ fetchingPeopleLiked: false })
        });
    }

    getPeopleLikedComments(feedId, commentId) {
        new Api(GetAPIHeader(Storage.getAccessToken())).v31.getCommentLikes(feedId, commentId)
        .then(response => {
            this.setState({fetchingPeopleLiked: false, peopleLikedData: response});
        }).catch((err) => {
            this.setState({ fetchingPeopleLiked: false })
        });
    }

    onShowingPeopleLiked = (feed) => {
        this.setState({
            showPeopleLiked: true,
            fetchingPeopleLiked: true
        }, this.getPeopleLiked.bind(this, feed.Id));
    }

    onShowingPeopleLikedComment = (feed, comment) => {
        this.setState({
            showPeopleLiked: true,
            fetchingPeopleLiked: true
        }, this.getPeopleLikedComments.bind(this, feed.Id,comment.Id))
    }

    spinnerLoading = (val, id) => {
        this.setState({
            spinnerLoading: val,
            spinnerCommentId: id
        });
    }

    closeLikePeopleModal = () => {
        this.setState({showPeopleLiked: false});
    }

    renderPeopleWhoLiked() {
        const {showPeopleLiked, fetchingPeopleLiked, peopleLikedData}=this.state;
        if(showPeopleLiked) {
            return (
                <LikedUserModal 
                    show={showPeopleLiked}
                    loading={fetchingPeopleLiked}
                    data={peopleLikedData}
                    closeModal={this.closeLikePeopleModal}
                />
            )
        }
    }

    loadFunc = () => {
        const { pageNumber, pageSize } = this.state;
        this.getFeedPosts(pageNumber+1, pageSize, "pagination");
    }

    removeCommentsAndObj(feed){
        const { enabledCommentsIds, commentsPgNo, commentsPgSize} = this.state;
        const isExists = enabledCommentsIds.some(el => el === feed.Id);              
        if(isExists) {
        } else {
            enabledCommentsIds.push(feed.Id);
        }
        this.setState({
            enabledCommentsIds: enabledCommentsIds,             
        }, this.getFeedCommentsData.bind(this, commentsPgNo, commentsPgSize, feed.Id, true));
    }

    shareTrackActivity(feed) {
        let activity = {
            Type: "post-share",
            Tags: feed.Id
          }
        new Api(GetAPIHeader(Storage.getAccessToken())).v31
        .trackActivity(activity)
        .then(response => {
            console.log(response);
        }).catch((err) => {
            ToastsStore.error(err.Message, 3000);
            ErrorHandling(err);
        });
    }

    shareLink(shareUrl) {
        const link = document.createElement('a');
        link.target = '_blank';
        link.href = shareUrl;
        link.rel = 'noopener noreferrer'; 
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
    }

    shareFeed(feed) {
        const feedType = GetPostType(feed);
        const UserProfile = Storage.getProfile();
        const feedPost = {
            feedId: parseInt(feed.Id),
            type: feedType,
            originalFeedUrl: window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '') + '/feed/' + feed.Id,
            content: CleanNameTag(feed.Content, true).replace(/\n/g, '<br>'), 
            feedImageUrl: feed.Images.length > 0 ? feed.Images.toString() : feed.Preview && feed.Preview.Url  ? feed.Preview.Url : feed.FeedImageUrl,
            createdBy: feed.FullName,
            createdDate: moment.utc(feed.DateCreated, 'YYYY-MM-DD HH:mm A').utc().toDate(),
            creatorImageUrl: feed.UserImageUrl,
            organization: UserProfile.tenant_name,
            organizationLogoUrl: UserProfile.tenant_logo
        };
        const token = "Bearer " + Storage.getAccessToken();
        fetch(`${process.env.REACT_APP_SHARE_API_URL}/api/Share`, 
        {
            method: 'POST',
            headers: {
                'Authorization': token,
                'Accept': ContentType.JSON,
                'Mode': 'cors',
                'Content-Type': ContentType.JSON
            },
            body: JSON.stringify(feedPost),
            crossDomain:true,
            credentials: 'omit'
        })
        .then(response => response.json())
        .then(data => {
            this.shareLink(data);
            this.shareTrackActivity(feed);
        })
        .catch((error) => {
                console.log(error)
        });
    }

    displayShareButton(feed) {
        const postType = GetPostType(feed);
        return postType !== 'document' && postType !== 'poll' && !(postType === 'system' && this.feed.Images.length === 1) && getIsEnabled(AllFeatures.FE_FEED_FACEBOOKSHARE);
    }

    renderFeedContent() {
        const {t}=this.props;
        const { hashtagView,viewPinnedFeeds, feeds, pinFeeds, loading, pinLoading, seeMoreFeedIndx,enabledCommentsIds, profileInfo, commentsEditorStateObj, appreciateLoading, appreciateFeedId, spinnerLoading, spinnerCommentId, hasMore } = this.state;
        const profilePicture = store.getState().profileInfo.profileInfo.ImageUrl;
        let allFeeds = (viewPinnedFeeds || hashtagView) ? feeds :  [...pinFeeds, ...feeds];
        let uniqueFeedArr = allFeeds.filter((v,i,a)=>a.findIndex(v2=>(v2.Id===v.Id))===i);
        return (
            <div className="row">
                <div className="col-xl-8">
                    {hashtagView ? this.renderHashtagBanner() : this.renderHeaderBanner()}
                    {this.renderViewPinnedPost()}
                    {loading || pinLoading ? <Loading Height="0" /> : 
                    <InfiniteScroll
                        pageStart={0}
                        loadMore={this.loadFunc}
                        hasMore={hasMore} 
                        initialLoad={false}
                        loader={<div className="loader text-center" key={0}>Loading ...</div>}
                    >
                    {uniqueFeedArr.length > 0 ?
                        uniqueFeedArr.map((feed, indx) => {
                            return (
                                    <div className="app-card feed-wrap mb-3" key={feed.Id}>
                                        <div className="d-flex align-items-center justify-content-between">
                                            <div className="d-flex pointer align-items-center"
                                                
                                                onClick={()=>{
                                                    this.props.history.push('/profile', {email: feed.Email});
                                                }}>
                                                <ImageUtils 
                                                    src={feed.UserImageUrl} 
                                                    name={feed.FullName}
                                                    width={60} className="rounded-circle"
                                                />
                                                <div className="pl-3">
                                                    <h6 className="font-weight-bold large text-black mt-1">{feed.FullName}</h6>
                                                    <h6 className="font-weight-normal normal text-gray mt-n1">{feed.Designation}</h6>
                                                </div>
                                            </div>
                                            <div>
                                            <div className="d-flex align-items-center">
                                                <div className="dropdown dropleft">
                                                        <span className="float-right"
                                                            role="button" id="dropdownMenuLink"
                                                            data-toggle="dropdown"
                                                            aria-haspopup="true"
                                                            aria-expanded="false">
                                                            <i className="far fa-ellipsis-h fa-lg text-gray pointer" />
                                                        </span>
                                    
                                                        <div className="dropdown-menu"
                                                            aria-labelledby="dropdownMenuLink">
                                                            {profileInfo && profileInfo.UserId === feed.CreatedBy &&
                                                            <span className="dropdown-item pointer small text-dark-gray font-weight-normal"
                                                            onClick={() => this.onEditFeed(feed)}><img className="mr-2" width="20" height="20" alt="" src={EditIcon} /> {t('newsFeed.editPost')}</span>}
                                                            {(getIsEnabled(AllFeatures.FE_FEED_DELETEFEED) || ((profileInfo && profileInfo.UserId) === feed.CreatedBy)) &&
                                                            <span className="dropdown-item pointer small text-dark-gray font-weight-normal"
                                                                onClick={() => this.onDeleteFeed(feed.Id)}><img className="mr-2" width="20" height="20" alt="" src={DeleteIcon} /> {t('newsFeed.deletePost')}</span>}
                                                            {!(profileInfo && profileInfo.UserId === feed.CreatedBy) && <span className="dropdown-item pointer small text-dark-gray font-weight-normal"
                                                            onClick={() => this.onReportPostFeed(feed.Id)}><img className="mr-2" width="20" height="20" alt="" src={ReportIcon} /> {t('newsFeed.reportPost')}</span>}
                                                            {getIsEnabled(AllFeatures.FE_FEED_PINFEED) && feed.IsPinPost ? 
                                                            <span className="dropdown-item pointer small text-dark-gray font-weight-normal"
                                                            onClick={() => this.onUnpinpostFeed(feed.Id)}><img className="mr-2" width="20" height="20" alt="" src={PinIcon} /> {t('newsFeed.unpinpost')}</span> :
                                                            getIsEnabled(AllFeatures.FE_FEED_PINFEED) && <span className="dropdown-item pointer small text-dark-gray font-weight-normal"
                                                                onClick={() => this.onPinpostFeed(feed.Id)}><img className="mr-2" width="20" height="20" alt="" src={PinIcon} /> {t('newsFeed.pinpost')}</span>}
                                                            {/* <span className="dropdown-item pointer small text-dark-gray font-weight-normal"
                                                            onClick={() => this.onCopyLinkFeed(feed.Id)}><img className="mr-2" width="20" height="20" alt="" src={CopyLinkIcon} /> {t('newsFeed.copyLink')}</span> */}
                                                            {feed.IsPinPost && <span className="dropdown-item pointer small text-dark-gray font-weight-normal"
                                                            onClick={() => this.onHidePinFeed(feed.Id)}><img className="mr-2" width="20" height="20" alt="" src={HidePinIcon} /> {t('newsFeed.hidepin')}</span>}
                                                        </div>
                                                </div>
                                                {feed.IsPinPost && <div className="pl-2"><img width="20" height="20" alt="" src={PinFeedIcon} /></div>}   
                                            </div>
                                            </div>
                                        </div>
                                        <div className="pt-3 pb-2">
                                            <div className="h-line" />
                                        </div>
                                        <p className="pt-2 normal text-dark-gray font-weight-normal" style={{whiteSpace: "pre-wrap"}}>   
                                            <TextFormat 
                                                content={feed.Content} 
                                                id={feed.Id}
                                                showChar={showFeedChar} 
                                                seeMoreIndx={seeMoreFeedIndx} 
                                                type="post" 
                                                spaces={feed.Spaces}
                                                setView={this.setHashtagView}
                                            />            
                                        </p>
                                            {(feed.Content && feed.Content.length > showFeedChar) &&
                                            <div className="row justify-content-end"> 
                                            <div className="float-right pr-4">
                                                <p className="pl-2 normal text-light-gray font-weight-bold pointer"
                                                    onClick={() => this.onSeeMoreClick(feed.Id)}>
                                                        {seeMoreFeedIndx.includes(feed.Id) ? null : t('newsFeed.seeMore')}
                                                </p>
                                            </div>
                                        </div>}
                                        {this.renderPostContent(feed)}
                                        
                                        <div className="pt-3 pb-2">
                                            <div className="h-line" />
                                        </div>

                                        <div className="row align-items-center justify-content-between">
                                        {getIsEnabled(AllFeatures.FE_FEED_POSTCOMMENT) ? 
                                            <div className="pl-3 pointer d-flex align-items-center"  onClick={() => this.onExpandingcomments(feed, indx)}>
                                            <span className="mr-2 mb-1 pointer"><img src={ChatCenteredIcon} alt=""/></span>
                                            <p className="small font-weight-normal" style={{color: "#666666"}}>{(feed.CommentCount > 0 ? feed.CommentCount : "") + " " + (feed.CommentCount > 1 ? t('newsFeed.comments') : t('newsFeed.comment'))}
                                            {enabledCommentsIds.includes(feed.Id) && <span className="ml-2 mb-1 pointer"><img src={DownIcon} alt="" /></span>}</p>
                                            </div>:<div/>}
                                             <div className="row justify-content-end align-items-center pr-3"> 
                                                {((appreciateLoading && appreciateFeedId === feed.Id) || (spinnerLoading && spinnerCommentId === feed.Id) )&&
                                                <div className="mt-0 p-0 mr-3 overflow-hidden float-right pr-4" style={{height:"16px"}}>
                                                    <Spinner height="40" />
                                                </div>}
                                            <div className="float-right pr-3">
                                                <div className="d-flex align-items-center">
                                                    {this.renderLikeIcon(feed)}
                                                        <p className="pl-2 text-light-gray small pointer" onClick={() => this.clickFeedLike(feed)}>{(feed.LikeCount > 0 ? feed.LikeCount : "") + " " + (feed.LikeCount > 1 ? t('newsFeed.likes') : t('newsFeed.like'))}</p>
                                                </div>
                                            </div>

                                            {this.displayShareButton(feed) &&
                                            <div className="float-right pr-3">
                                                <div onClick={() => this.shareFeed(feed)} className="d-flex align-items-center pointer">
                                                    <img src={ShareIcon} alt="" />
                                                    <p className="pl-2 text-light-gray small">{t('newsFeed.share')}</p>
                                                </div>
                                            </div>}

                                            <div className="float-right pr-3">
                                                <div className="d-flex align-items-center">
                                                    <img src={ClockIcon} alt="" onClick={() => {}} />
                                                        <p className="pl-2 text-light-gray small">{getexactTimeOrdate(feed.DateCreated)}</p>
                                                </div>
                                            </div>
                                            </div>
                                            </div>
                                            <div className="row d-flex align-items-center pt-2">
                                            <div className="col-12 col-md-12 col-lg-12 col-sm-12 col-xl-12">
                                                {getIsEnabled(AllFeatures.FE_FEED_POSTCOMMENT) && enabledCommentsIds.includes(feed.Id) &&
                                                <div className="d-flex align-items-center">
                                                
                                                    <ImageUtils 
                                                        src={profilePicture}
                                                        name={profileInfo && profileInfo.FullName}
                                                        width={40} className="rounded-circle"
                                                    />
                                                    {<CommentEditor feed={feed} indx={indx} commentsEditorStateObj={commentsEditorStateObj} commentsObj={this.state.commentsObj}
                                                        editPostMode={this.state.editPostMode} editMentions={this.state.editMentions} 
                                                        getFeedCommentsData={this.getFeedCommentsData.bind(this)} removeCommentsAndObj={this.removeCommentsAndObj.bind(this)}
                                                            getFeedPostById={this.getFeedPostById.bind(this)} shrinkReplySection={this.shrinkReplySection}
                                                            spinnerLoading={this.spinnerLoading}
                                                        userList={this.state.userList}/>}
                                                </div>}
                                            </div> 

                                        </div>
                                            {this.renderFeedComments(feed)}
                                    </div>
                                )}) : 
                                <div>
                                    <h5 className="text-center text-black font-weight-bold pt-4">{t('newsFeed.noFeedsAvailable')}</h5>
                                </div>
                    }</InfiniteScroll>}
                </div>
                <div className="col-xl-4">
                    {/* <div className="app-card mb-3">
                        <div className="d-flex align-items-center justify-content-between">
                            <p className="large font-weight-bold">{"Rewards"}</p>
                            <i className="icon-more-horizontal text-gray pointer" />
                        </div>
                        <div className="pt-2">
                                <img width={"100%"} height={150} className="rounded" alt=""
                                    src={RewardSampleImg} />
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <p className="mt-2 normal font-weight-bold">{"$5 Grab Voucher"}</p>
                                        <p className="text-primary normal font-weight-bold">{"5 EP"}</p>
                                    </div>
                                    <div>
                                        <button className={"py-1 px-3 btn-primary btn-border-radius border-0"} 
                                            onClick={() => {}}
                                            disabled={false}>
                                            <span className="font-weight-normal text-white small">{"Redeem"}</span>
                                        </button>
                                    </div>
                                </div>
                            <p style={{position:"absolute", top:58,right:42}} className="small rounded p-1 pr-2 pl-2 bg-white font-weight-bold text-danger pointer">{t('redemption.approvalRequired')}</p> 
                        </div>
                    </div> */}

                    {/* <div className="app-card mb-3">
                        <div className="d-flex align-items-center justify-content-between">
                            <p className="large font-weight-bold">{"Groups"}</p>
                            <i className="icon-more-horizontal text-gray pointer" />
                        </div>
                        <div className="pt-2">
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center">
                                <img className="rounded" alt=""
                                        width={60} height={60}
                                        src={"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTcAb_z_Fv3SL9U2LHCs2xDIryv9Yv6J_3mkQ&usqp=CAU"} 
                                    />
                                    <div className="pl-2">
                                        <p className="text-black normal">{"Learning Club"}</p>
                                        <p className="x-small text-gray">{"38 Members"}</p>
                                    </div>
                                </div>

                                <div>
                                    <i className="far fa-bell text-primary x-small" />
                                    <span className="text-primary x-small pl-1">18</span>
                                </div>
                            </div>
                            <div className="pt-2 pb-2">
                            <div className="line" />
                            </div>
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center">
                                <img className="rounded" alt=""
                                        width={60} height={60}
                                        src={"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQiSYS19M1gYfL8YDGZfSFG-FC-fKcqinwAyU1Pj5YowfUkGVyWxRgGiyIDxZjHRk8ViL0&usqp=CAU"} 
                                    />
                                    <div className="pl-2">
                                        <p className="text-black normal">{"Smart is the new sexy"}</p>
                                        <p className="x-small text-gray">{"129 Members"}</p>
                                    </div>
                                </div>

                                <div>
                                    <i className="far fa-bell text-primary x-small" />
                                    <span className="text-primary x-small pl-1">27</span>
                                </div>
                            </div>

                            <div className="pt-2 pb-2">
                            <div className="line" />
                            </div>

                            <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center">
                                <img className="rounded" alt=""
                                        width={60} height={60}
                                        src={"https://www.wallpaperflare.com/static/481/395/709/happy-smiley-emoji-ball-wallpaper.jpg"} 
                                    />
                                    <div className="pl-2">
                                        <p className="text-black normal">{"XOXO League"}</p>
                                        <p className="x-small text-gray">{"73 Members"}</p>
                                    </div>
                                </div>

                                <div>
                                    <i className="far fa-bell text-primary x-small" />
                                    <span className="text-primary x-small pl-1">3</span>
                                </div>
                            </div>
                            <div className="row justify-content-end pr-3 pt-3">
                                <button type="button" className="btn btn-outline-primary">
                                    See all
                                </button>
                            </div>
                            
                        </div>
                    </div> */}
                </div>
            </div>
        )
    }

    render() {
        const {sharePostModal, profileInfo, editPostMode, allSpaces, postText, editFeedId, editMentions, editRawState, editFeedData, userList} = this.state;
        return (
            <div className="container">
                <ToastsContainer store={ToastsStore} position={ToastsContainerPosition.TOP_RIGHT} />  
                {this.renderFeedDeleteModal()}
                {this.renderCommentDeleteModal()}
                {this.renderReplyDeleteModal()}
                {this.renderPinpostFeedModal()}
                {this.renderUnpinpostFeedModal()}
                {this.renderReportPost()}
                {this.renderFeedContent()}
                {this.renderPeopleWhoLiked()}
                {sharePostModal && <SharePost sharePostModal={sharePostModal} profileInfo={profileInfo} editPostMode={editPostMode} 
                    editMentions={editMentions} editRawState={editRawState} editFeedData={editFeedData}
                    getFeedPosts={this.getFeedPosts.bind(this)} getAllSpaces={this.getAllSpaces.bind(this)} closeModalValues={this.closeModalValues.bind(this)} 
                    getFeedPostById={this.getFeedPostById.bind(this)} userList={userList}
                    allSpaces={allSpaces} postText={postText} editFeedId={editFeedId} />}
            </div>
        );
    }
}

export default withTranslation('translation')((connect())(withRouter(Home)));