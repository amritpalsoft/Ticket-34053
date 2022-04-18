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
import { LocalDateTime, getexactTimeOrdate } from '../../constants/constants';
import ImageUtils from "../../components/Utils/ImageUtils/ImageUtils";
import Empty from "../../components/Utils/Empty/Empty";
import { withTranslation } from 'react-i18next';
import StorageUtils from '../../containers/utils/StorageUtils';

const Storage = new StorageUtils();

class QuestList extends React.Component {
    _isMounted = false;

    constructor(props) {
        super(props);
        this.state = {
            questList: [],
            ifExpired:true,
            avatars: [],
            badgeInfo: [],
            openModal: 0,
            loading: 1,
            loadingBadgeData: 1,
            language: 'en'
        }
    }
     refreshQuestList() {
        this.props.getQuestList();
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
        this.setState({ openModal: 0, loadingBadgeData: 1, badgeInfo: [] });
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

    getTimeLeftLabel(date) {
        const {t}=this.props;
        let label;
        let startDate = moment.utc().add('days', 7).format('YYYY-MM-DD hh:mm A');
        if(date < startDate) {
            label = t('quest.timeLeft')
        } else {
            label = t('quest.dueby')
        }
        return label;
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
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    render() {
        const pointsType = this.props.PointsType;
        const marginB = this.props.marginBottom;
        let questList = this.props.questList;
        const {t} = this.props;
        if (this.props.questModalId) {
            const result = this.props.questList.filter(obj => {
                return obj.QuestId === this.props.questModalId
            })
            
            if(result.length===0 && this.state.ifExpired){
                this.props.questResults()
                const result2 = this.props.questList.filter(obj => {
                    return obj.QuestId === this.props.questModalId
                })

                if(result2.length===0){
                    this.setState({ifExpired:false})
                 }else{
                    questList=result2
                }
            }else{
                questList=result
               }
        }
    
        return(
             this.props.loading ? <Loading/>
            :
            <div>   
            {questList && questList.length === 0 ?
                    <Empty image={emptyQuest} 
                    secondaryText={!this.props.questModalId && (this.props.completed ? t("quest.completedSecEmptyQuest") : t("quest.secEmptyQuest"))}
                    text={!this.props.questModalId ? (this.props.completed ? t("quest.completedEmptyQuest") : t('quest.emptyQuest')) : t('quest.questNotFound')} />
                    : questList && questList.map((quest) =>
                    <div key={quest.Id}>
                            <div className={!marginB ? "app-card mb-4" : marginB}>
                        
                                <div className="clearfix mb-2">
                                    <span className="app-border-blue-badge-pill">{quest.CategoryName}</span>&nbsp;
                                    {quest.Skills.map((skills) =>
                                        <span className="app-blue-skills-pill mt-1 mr-1">{skills.Name}</span>
                                    )}
                                    <p className="text-primary font-weight-bold small float-right">
                                        <i className="fa fa-star"></i>{PointsFormat(quest.Point) + ' ' + pointsType.toUpperCase()}
                                    </p>
                                </div>

                                {quest.Completed ?
                                    <i className="icon-check_circle icon-large text-primary float-left mr-2"></i> :
                                    <CircularProgressbar value={this.calculateTotalTasks(quest.Conditions)}
                                        className="progress1" strokeWidth={15}
                                        style={{ border: '2px solid #b5bbc1', borderRadius: '50%' }} />}

                                <h5 className="text-break">{quest.Name}</h5>
                                <p className="normal text-break pre-wrap">{quest.Description}</p>

                                <Stepper conditions={quest.Conditions} userQuestId={quest.Id} completed={this.props.completed}
                                quest={quest} onRefresh={this.refreshQuestList.bind(this)} />

                                <div className="line"></div>

                                <div className="d-flex flex-wrap">
                                    <div className="d-flex flex-fill p-3" style={{ wordWrap: 'break-word', overflow: 'hidden' }}>
                                        <div>
                                            <img src={badgeIcon} alt=""
                                                style={{ width: 36, cursor: 'pointer' }}
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

                                    <div className=" d-flex flex-fill p-3" style={{ wordBreak: 'break-word', overflow: 'hidden' }}>
                                        <div
                                            className="mr-2 bg-light-red rounded-circle text-center d-table"
                                            style={{ width: 36, height: 36 }}>
                                            <i className="far fa-clock text-danger d-table-cell align-middle"></i>
                                        </div>
                                        <div>
                                            <p className="small font-weight-bold">{quest.HasNoExpireDate === true ? '-' : getexactTimeOrdate(quest.EndDate)}</p>
                                            <p className="small text-gray">{this.getTimeLeftLabel(quest.EndDate)}</p> 
                                        </div>
                                    </div>

                                    <div className="d-flex flex-fill p-3" style={{ wordWrap: 'break-word', overflow: 'hidden' }}>
                                        <div className="mr-2 d-flex">
                                            {Object.keys(quest.MyConditions).map((items) =>
                                                quest.MyConditions[items].ModeratorsList !== undefined ?
                                                    quest.MyConditions[items].ModeratorsList.map((subitem, idx) =>
                                                        subitem.isModeratorQuest === false ? null :
                                                            subitem.img !== null &&
                                                            <div key={idx} className={"d-  " + (idx >= 1 && 'multi-mod-img')}>
                                                                <ImageUtils src={subitem.img} name={subitem.name}
                                                                    width={36} />
                                                            </div>
                                                    ) : null
                                            )}
                                        </div>
                                        {quest.MyConditions.map((questConditions) =>
                                            questConditions.Id !== undefined ? null :
                                                questConditions.Name !== '0 People' ?
                                                    <div key={questConditions.Name}>
                                                        <p className="small font-weight-bold" style={{ wordBreak: 'break-word', overflow: 'hidden' }}>{questConditions.Name}</p>
                                                        <p className="small text-gray">{questConditions.Count == 1 ? 'Moderator' : 'Moderators'}</p>
                                                    </div>
                                                    : null
                                        )}
                                    </div>
                                </div>
                                <div className="line"></div>
                                <p className="small mt-3 text-gray">
                                    <i className="far fa-clock"></i>&nbsp;{t("quest.created")}:&nbsp;{this.formatDate(LocalDateTime(quest.CreatedDate))}
                                </p>
                            </div>
                        </div>
                    )
                    }
        </div>
    )
    }
}

export default withTranslation('translation')(QuestList);
