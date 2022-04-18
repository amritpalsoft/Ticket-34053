import React from 'react';
import './quest.scss';
import '../../assets/css/floating-labels.css';
import badgeIcon from '../../assets/icons/nobadge.png';
import emptyQuest from '../../assets/images/empty/quest.svg';
import { Api } from './../../api/Api';
import GetAPIHeader from './../../api/ApiCaller';
import ErrorHandling from './../../api/ErrorHandling';
import moment from 'moment';
import Stepper from './VerticalProgressBar';
import { PointsFormat } from '../../components/numberFormatter/NumberFormatter';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import BadgeDetails from './../../components/Modal/BadgeDetails';
import $ from 'jquery';
import Loading from '../../components/Loading/loading';
import { LocalDateTime } from '../../constants/constants';
import ImageUtils from "../../components/Utils/ImageUtils/ImageUtils";
import Empty from "../../components/Utils/Empty/Empty";
import { withTranslation } from 'react-i18next';
import StorageUtils from '../../containers/utils/StorageUtils';

const Storage = new StorageUtils();
class Quest extends React.Component {
    _isMounted = false;

    constructor(props) {
        super(props);

        this.state = {
            questList: [],
            avatars: [],
            badgeInfo: [],
            openModal: 0,
            loading: 1,
            loadingBadgeData: 1,
            language: 'en'
        }
    }
    getQuestList() {
        new Api(GetAPIHeader(Storage.getAccessToken())).v31.getUserQuest(undefined, undefined)
            .then(results => {
                if (results != null) {
                    if (this.props.completed) {
                        this.mapQuest(results.Claimed);
                    } else {
                        this.mapQuest(results.Incomplete);
                    }

                } else {
                    this.setState({ loading: 0 });
                }
            }).catch((err) => {				ErrorHandling(err)
                console.log(err)
            });
    }

    mapQuest(result) {
        const myQuest = result.map((item) => {
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
                MyConditions: [...item.Conditions,
                {
                    Total: item.Conditions.length,
                    // Name: item.Conditions.filter((innerItem) => innerItem.isModeratorQuest === true).length == 1 ? item.Conditions.filter((innerItem) => innerItem.isModeratorQuest === true)[0].ModeratorName : (item.Conditions.filter((innerItem) => innerItem.isModeratorQuest === true).length + ' People'),
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
        });
        this.setState({ questList: myQuest, loading: 0 });

    }

    refreshQuestList() {
        this.getQuestList();
        this.props.getTabCount();
    }

    getBadgeInfo(code) {
        const UserProfile = Storage.getProfile();;
        new Api(GetAPIHeader(Storage.getAccessToken())).v31.getBadge(UserProfile.email, code)
            .then(results => {
                this.setState({ badgeInfo: results, loadingBadgeData: 0 })
            }).catch((err) => {				ErrorHandling(err)
                console.log(err)
            });
    }

    openModal(badgeCode) {
        if (badgeCode !== '') {
            this.getBadgeInfo(badgeCode);
            this.setState({ openModal: 1 });
        }
    }

    HideModal() {
        this.setState({ openModal: 0 });
        $('#myModal').modal('hide');
    }

    formatDate(string) {
        return moment(string).format('DD MMMM YYYY');
    }

    toLocal(date) {
        return moment.utc(date, 'YYYY-MM-DD HH:mm:ss A').local();
    }

    isExpired(dueDate) {
        return moment([]).isAfter(this.toLocal(dueDate).add(1, 'days'));
    }

    getQuestTimeLeft(questEndDateTime) {
        let startDate = moment.utc().add('days', 7).format('YYYY-MM-DD hh:mm A');
        let endDate = questEndDateTime;
        let retriveDate;
        let fromNow = moment(LocalDateTime(endDate)).fromNow();
        if (endDate < startDate) {
            if (fromNow === 'in a day') {
                retriveDate = 'Tomorrow';
            } else if (fromNow === 'in an hour') {
                retriveDate = '1 hour';
            } else {
                retriveDate = fromNow.replace('in', '');
            }
        } else {
            retriveDate = moment(endDate).format('DD MMM YYYY');
        }
        return retriveDate;
    }

    calculateCompletedTasks(QuestTasks) {
        return QuestTasks.length === QuestTasks.filter((tasks) => tasks.Completed === true).length ? '✓' : QuestTasks.filter((tasks) => tasks.Completed === true).length;
    }

    calculateTotalTasks(QuestTasks) {
        if (QuestTasks.length == 0) {
            return 0;
        } else {
            return 100 * (QuestTasks.filter((tasks) => tasks.Completed === true).length / QuestTasks.length);
        }
    }

    componentDidMount() {
        this._isMounted = true;
        if (this._isMounted) {
            this.getQuestList();
        }
    }
    componentWillUnmount() {
        this._isMounted = false;
    }
    render() {
        const pointsType = this.props.PointsType;
        const {t} = this.props;
        return (
            <div>
                {this.state.loading ? <Loading Height="0" /> :
                    this.state.questList.length === 0 ?
                        <Empty image={emptyQuest} text={t("quest.emptyQuest")} />
                        : this.state.questList.filter((i, index) => (index < 1)).map((quest) =>
                            <div key={quest.Id}>
                                <div className="app-card mb-4">
                                    <div className="clearfix mb-2">
                                        <span className="app-border-blue-badge-pill">{quest.CategoryName}</span>&nbsp;
                                        {quest.Skills.map((skills) =>
                                            <span className="app-blue-skills-pill mt-1 mr-1">{skills.Name}</span>
                                        )}
                                        <p className="text-primary font-weight-bold small float-right">
                                            <i className="fa fa-star"></i>{PointsFormat(quest.Point) + ' ' + pointsType}
                                        </p>
                                    </div>
                                    {quest.Completed ?
                                        <i className="icon-check_circle icon-large text-primary float-left mr-2"></i> :
                                        <CircularProgressbar value={this.calculateTotalTasks(quest.Conditions)}
                                            className="progress1" strokeWidth={15}
                                            style={{ border: '2px solid #b5bbc1', borderRadius: '50%' }} />}

                                    <h5 className="">{quest.Name}</h5>
                                    <p className="normal">{quest.Description}</p>

                                    <Stepper conditions={quest.Conditions} userQuestId={quest.Id}
                                        onRefresh={this.refreshQuestList.bind(this)} />

                                    <div className="line"></div>

                                    <div className="d-flex flex-wrap" style={{ wordBreak: 'break-word', overflow: 'hidden' }}>
                                        <div className="flex-fill d-flex p-3">
                                            <div>
                                                <img src={badgeIcon} alt=""
                                                    style={{ width: 36 }}
                                                    className="bg-light-green rounded-circle p-2 mr-2"
                                                    data-target="#myModal"
                                                    onClick={() => this.openModal(quest.BadgeCode)} />
                                                {this.state.openModal === 1 &&
                                                    <BadgeDetails className="show" header={this.state.badgeInfo.Name}
                                                        badgeBody={this.state.badgeInfo}
                                                        onHide={this.HideModal.bind(this)}
                                                        loading={this.state.loadingBadgeData} />
                                                }
                                            </div>
                                            <div>
                                                <p className="small font-weight-bold" style={{ wordBreak: 'break-word', overflow: 'hidden' }}>{quest.BadgeName !== '' ? quest.BadgeName : '-'}</p>
                                                <p className="small text-gray">{t("quest.badge")}</p>
                                            </div>
                                        </div>

                                        <div className="flex-fill d-flex p-3" style={{ wordBreak: 'break-word', overflow: 'hidden' }}>
                                            <div
                                                className="mr-2 bg-light-red rounded-circle text-center d-table"
                                                style={{ width: 36, height: 36 }}>
                                                <i className="far fa-clock text-danger d-table-cell align-middle"></i>
                                            </div>
                                            <div>
                                                <p className="small font-weight-bold">{quest.HasNoExpireDate === true ? '-' : this.getQuestTimeLeft(quest.EndDate)}</p>
                                                <p className="small text-gray">{t("quest.timeLeft")}</p>
                                            </div>
                                        </div>

                                        <div className="flex-fill d-flex p-3" style={{ wordBreak: 'break-word', overflow: 'hidden' }}>
                                            <div className="mr-2">
                                                {Object.keys(quest.MyConditions).map((items) => {
                                                    return quest.MyConditions[items].ModeratorsList !== undefined ?
                                                        quest.MyConditions[items].ModeratorsList.map((subitem, idx) => {
                                                            return (
                                                                subitem.isModeratorQuest === false ? null :
                                                                    subitem.img !== null &&
                                                                    <div
                                                                        className={"float-left " + (idx >= 1 && 'multi-mod-img')}>
                                                                        <ImageUtils src={subitem.img} name={subitem.name}
                                                                            width={36} />
                                                                    </div>
                                                            )
                                                        }) : null
                                                })
                                                }
                                            </div>
                                            {quest.MyConditions.map((questConditions) => {
                                                return questConditions.Id !== undefined ? null :
                                                    questConditions.Name !== '0 People' ?
                                                        <div key={questConditions.Name}>
                                                            <p className="small font-weight-bold" style={{ wordBreak: 'break-word', overflow: 'hidden' }}>{questConditions.Name}</p>
                                                            <p className="small text-gray">{questConditions.Count == 1 ? 'Moderator' : 'Moderators'}</p>
                                                        </div>
                                                        : null
                                            })}
                                        </div>
                                    </div>
                                    <div className="line"></div>
                                    <p className="small mt-3 text-gray">
                                        <i className="far fa-clock"></i>&nbsp;{t("quest.created")}:&nbsp;{this.formatDate(LocalDateTime(quest.StartDate))}
                                    </p>
                                </div>
                            </div>
                        )}
            </div>
        )
    }
}

export default withTranslation('translation')(Quest);
