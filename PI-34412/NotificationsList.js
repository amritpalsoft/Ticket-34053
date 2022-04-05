import React from 'react';
import { withRouter } from 'react-router-dom';
import './notification.scss';
import { Api } from '../../api/Api';
import GetAPIHeader from '../../api/ApiCaller';
import ErrorHandling from '../../api/ErrorHandling';
import moment from 'moment';
import Pagination from "react-js-pagination";
import emptyNotification from '../../assets/images/empty/notifications.svg';
import Loading from '../../components/Loading/loading';
import { LocalDate, LocalDateTime } from '../../constants/constants';
import Empty from "../../components/Utils/Empty/Empty";
import { withTranslation } from 'react-i18next';
import StorageUtils from '../../containers/utils/StorageUtils';
import {connect} from 'react-redux';
import {setImportantNotificationStatus} from '../../redux/actions/notificationActions';

const Storage = new StorageUtils();
class notificationsList extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            Notifications: [],
            allIDs: [],
            totalPages: 0,
            loading: 1,
            pageNumber: 1,
            pageSize: 30
        }
    }

    async componentDidMount() {
        const { pageNumber, pageSize } = this.state;
        await this.getNotifications(pageNumber, pageSize);
    }

    getNotifications(pageNumber, pageSize) {
        new Api(GetAPIHeader(Storage.getAccessToken())).v31.getNotifications2({
            pageNumber: pageNumber,
            pageSize: pageSize,
            alertStatus: this.props.read
        })
            .then(response => {
                let ids=[];
                const groups = response.Result.reduce((groups, notification) => {
                    let createdDate = notification.CreatedTime;
                    let date = LocalDate(createdDate);
                    if (!groups[date]) {
                        groups[date] = [];
                    }
                    ids.push(notification.Id);
                    groups[date].push(notification);
                    return groups;
                }, {});
                const groupArrays = Object.keys(groups).map((date) => {
                    return {
                        date,
                        notifications: groups[date]
                    };
                });
                this.setState({ Notifications: groupArrays, unfilteredNotifications: response.Result ,allIDs: ids, totalPages: response.Total, loading: 0 })
            }).catch((err) => {
                ErrorHandling(err)
            });
    }

    handlePageChange(selectedPage) {
        const { pageSize } = this.state;
        this.setState({pageNumber: selectedPage});
        this.getNotifications(selectedPage, pageSize);
    }

    onNotificationClick(notification) {
        let path = this.pathPicker(notification.NotificationType);
        let notificationTypeIds = JSON.parse(notification.NotificationTypeIds);
        let type = notification.NotificationType;
        if (path === "goalSetting") {
            path = this.addGoalID(notification, path);
        }
        if (path === "quiz") {
            path = this.addQuizID(notification, path);
        }
        if (path === "survey") {
            path = this.addSurveyID(notification, path);
        }
        if (path === "quest") {
            path = this.addQuestID(notification, path);
        }
        if (path === "feedback") {
            path = this.addFeedbackID(notification, path);
            if (type === "AdhocFeedbackRequest" || type === "AdhocFeedbackGiveAssigned") {
                localStorage.setItem('activeTab', '#nav-request');
            }
            else if (type === "AdhocFeedbackGive") {
                localStorage.setItem('activeTab', '#nav-received');
            }
        }

        if (!notification.IsAlerted) {
            this.markAsReadNotification(notification.Id)
        }
        this.props.history.push(path, {
            notificationId: notificationTypeIds &&
                (type === "QuizCreate" || type === "QuizUpdateDueDate" || type === "QuizReminder" || type === "QuizCancel") ? notificationTypeIds.quizId :
                type === "AdhocFeedbackRequest" ? notificationTypeIds.adhocFeedbackRequestId :
                    (type === "AdhocFeedbackGiveAssigned" || type === "AdhocFeedbackGive") ? notificationTypeIds.adhocFeedbackAssignmentId :
            (type === "Feed") ? notificationTypeIds.feedId :
            (type === "SurveyCreate" || type === "SurveyUpdateDueDate" || type === "SurveyReminder") && notificationTypeIds.sendSurveyId,
            notificationType: notification.NotificationType,
        })
    }

    addQuizID(notification, path) {
        let notificationTypeIds = JSON.parse(notification.NotificationTypeIds);
        let type = notification.NotificationType;
        if (type === "QuizCreate" || type === "QuizReminder") {
            path = 'quizMe?id=' + notificationTypeIds.quizId;
        }

        if (type === "QuizCancel") {
            path = 'quizMe';
        }

        return path;
    }
    addSurveyID(notification, path) {
        let notificationType = JSON.parse(notification.NotificationTypeIds);
        let surveyId = notificationType !== null ? notificationType.sendSurveyId : "";
        let surveyIdwithPath = path + '?survey=' + surveyId;
        return surveyIdwithPath;
    }
    addGoalID(notification, path) {
        let notificationType = JSON.parse(notification.NotificationTypeIds);
        let goalId = notificationType.goalId;
        let goalIdwithPath = path + '?goalid=' + goalId;
        return goalIdwithPath;
    }
    addQuestID(notification, path) {
        let notificationType = JSON.parse(notification.NotificationTypeIds);
        let questId = notificationType.questId;
        let questIdwithPath = path + '?questid=' + questId;
        return questIdwithPath;
    }
    addFeedbackID(notification, path) {
        let notificationType = notification.NotificationType;
        let notificationTypeIds = JSON.parse(notification.NotificationTypeIds);
        let feedbackId = (notificationType === "AdhocFeedbackRequest" ?
            notificationTypeIds.adhocFeedbackRequestId : (notificationType === "AdhocFeedbackGiveAssigned" ||
                notificationType === "AdhocFeedbackGive") ? notificationTypeIds.adhocFeedbackAssignmentId : '');
        let feedbackIdwithPath = path + '?feedbackid=' + feedbackId;
        return feedbackIdwithPath;
    }
    markAsReadNotification(id) {
        const {dispatch} = this.props;
        new Api(GetAPIHeader(Storage.getAccessToken())).v31.deleteNotification([id])
            .then(response => {
                new Api(GetAPIHeader(Storage.getAccessToken())).v31.getNotificationsStats()
                .then(response => {
                    dispatch(setImportantNotificationStatus(response.Important));
                }).catch((err) => {
                    ErrorHandling(err)
                });
            }).catch((err) => {
                ErrorHandling(err)
            });
    }
    refreshNotifications() {
        const {read}=this.props;
        const {pageNumber, pageSize, totalPages}=this.state;
        let pgNo;
        if(read === 2 && pageNumber===Math.ceil(totalPages/pageSize)) {
            pgNo = Math.ceil(totalPages/30)-1;
        } else {
            pgNo = pageNumber;
        }
        this.setState({pageNumber: pgNo});
        this.getNotifications(pgNo, pageSize);
    }
    onMarkAllAsReadClick = () => {
        const { allIDs } = this.state;
        new Api(GetAPIHeader(Storage.getAccessToken())).v31.deleteNotification(allIDs)
            .then(response => {
                this.refreshNotifications();
                this.props.notificationsCount();
            }).catch((err) => {
                ErrorHandling(err)
            });
    }
    iconPicker(type) {
        let className;
        if (type === "NewQuest" || type === "QuestReminder" || type === "ModeratorQuest") {
            className = "icon-ic_quest";
        } else if (type === "RedemptionReject" || type === "RedemptionApprove") {
            className = "icon-ic_reward";
        } else if (type === "GoalCreate" || type === "GoalUpdateStatus" || type === "GoalUpdate" || type === "GoalDelete" || type === "GoalReminder" || type === "GoalOverdue") {
            className = "icon-ic_goal";
        } else if (type === "QuizCreate" || type === "QuizUpdateDueDate" || type === "QuizReminder" || type === "QuizCancel") {
            className = "icon-ic_quiz";
        } else if (type === "Badge" || type === "Reward") {
            className = "icon-ic_Like-Thumb";
        } else {
            className = "icon-ic_notification";
        }
        return className;
    }
    pathPicker(type) {
        let path;
        if (type === "NewQuest" || type === "QuestReminder") {
            path = "quest";
        } else if (type === "ModeratorQuest") {
            path = "quest/moderator";
        } else if (type === "ModeratorQuestReject") {
            path = "quest";
        } else if (type === "RedemptionReject" || type === "RedemptionApprove") {
            path = "redemption/history";
        } else if (type === "GoalCreate" || type === "GoalUpdateStatus" || type === "GoalUpdate" || type === "GoalDelete" || type === "GoalReminder" || type === "GoalOverdue") {
            path = "goalSetting";
        } else if (type === "Badge" || type === "Reward") {
            path = "mypoints";
        } else if (type === "QuizCreate" || type === "QuizUpdateDueDate" || type === "QuizReminder" || type === "QuizCancel") {
            path = "quiz"
        } else if (type === "AdhocFeedbackRequest" || type === "AdhocFeedbackGiveAssigned" || type === "AdhocFeedbackGive") {
            path = "feedback"
        } else if (type === "PollCreate") {
            path = "polls";
        } else if (type === "SurveyCreate" || type === "SurveyUpdateDueDate" || type === "SurveyReminder" || type === "SurveyCancel") {
            path = "survey";
        } else if(type === "ReportedFeed" || type === "FeedPin" || type === "FeedCommentOwner" ||
                type === "FeedCreateTag" || type === "FeedCreateGroupMember" || 
                type === "FeedUpdate" || type === "FeedCommentTag" ||
                type === "FeedCommentCommenter" || type === "FeedLikeTagged" ||
                type === "FeedLikeOwner" || type === "CommentUpdateComment" ||
                type === "CommentLikeCommentTagged" || type === "CommentLikeCommentOwner" ||
                type === "CommentReplyCommentTagged" || type === "CommentReplyCommentOwner" ||
                type === "CommentReplyCommentTag" || type === "CommentReplyCommentReplier" || type === "Feed") {
            path = "feed";
        } else if(type == "MIBCreate"){
            path = "mib";
        } else {
            path = "home";
        }
        return path;
    }
    renderNotification(item, index) {
        const uniqueValuesSet = new Set();
        const arr=item.notifications
        
        const filteredArr = arr.filter((obj) => {
        const isPresentInSet = uniqueValuesSet.has(obj.Content);
        uniqueValuesSet.add(obj.Content);
        return !isPresentInSet
           });

        const { t } = this.props;
        return (
            <div key={index} className="">
                <p className="text_grey normal font-weight-bold mt-4 mb-2">{moment(item.date).format('DD MMM YYYY')}</p>
                {
                    filteredArr.map((eachNotification) => {
                        let iconClass = this.iconPicker(eachNotification.NotificationType)
                        return (
                            <div className="app-card d-flex mb-2 pointer" key={eachNotification.Id}
                                onClick={this.onNotificationClick.bind(this, eachNotification)}>
                                {
                                    eachNotification.IsImportant ?
                                        <i className={(eachNotification.IsAlerted ? "text-gray " : "text-red ") + " mr-3 p-2 align-self-center xx-large " + iconClass}
                                            style={{ opacity: eachNotification.IsAlerted ? 0.5 : 1 }}></i>
                                        : <i className={(eachNotification.IsAlerted ? "text-gray " : "text-primary ") + " mr-3 p-2 align-self-center xx-large " + iconClass}
                                            style={{ opacity: eachNotification.IsAlerted ? 0.5 : 1 }}></i>
                                }

                                <div style={{ wordWrap: 'break-word', overflow: 'hidden' }} className="p-2">
                                    {eachNotification.IsImportant === true &&//tabName === 'all' &&
                                        <p className="font-weight-bold small" style={{ color: '#FF0000', opacity: eachNotification.IsAlerted ? 0.5 : 1 }}>{t('notifications.attention')}</p>}
                                    <p className="font-weight-bold normal" style={{ opacity: eachNotification.IsAlerted ? 0.5 : 1 }}>{eachNotification.Content}</p>
                                    <p className="text-grey small" style={{ opacity: eachNotification.IsAlerted ? 0.5 : 1 }}>{moment(LocalDateTime(eachNotification.CreatedTime)).calendar()}</p>
                                </div>
                            </div>
                        )

                    })
                }
            </div>
        )
    }

    renderMarkAllRead() {
        const { unfilteredNotifications } = this.state;
        const { t, read } = this.props;
        let showMarkasRead = false, isAllRead = true;
        if (read === 2) {
            let isImportantMsgExists = unfilteredNotifications.some(el => el.IsImportant);
            showMarkasRead = !isImportantMsgExists;
        }
        if(read === 4) {
            for (let i = 0; i < unfilteredNotifications.length; i++) {
                if (!unfilteredNotifications[i].IsAlerted) {
                    isAllRead = false;
                    break;
                }
            }
        }
        if (showMarkasRead || !isAllRead) {
            return <h6 onClick={this.onMarkAllAsReadClick} className="float-right text_grey normal mt-3 mb-3 pointer">{t('notifications.markAsRead')}</h6>
        }
    }

    render() {
        const { t } = this.props;
        const { loading, pageNumber, pageSize, totalPages, Notifications } = this.state;
        return (
            <div>
                {loading ? <Loading Height="0" /> :
                    Notifications.length === 0 ?
                        <Empty image={emptyNotification} text={t('notifications.noNotificationMsg')} />
                        :
                        <div>
                            {this.renderMarkAllRead()}
                            <div className="clearfix"></div>
                        
                            {Notifications.length > 0 && Notifications.map((item, index) => {
                                if (item.notifications.length > 0) {
                                    return this.renderNotification(item, index);
                                }
                            })}
                            <Pagination className="pagination modal-1"
                                activePage={pageNumber}
                                itemsCountPerPage={pageSize}
                                totalItemsCount={totalPages}
                                onChange={this.handlePageChange.bind(this)}
                            />
                        </div>
                }
            </div>
        )
    }
}

export default withTranslation('translation')((connect())(withRouter(notificationsList)));


