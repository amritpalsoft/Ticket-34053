import React from 'react';
import { withRouter } from 'react-router-dom';
import './notification.scss';
import $ from 'jquery';
import NotificationsList from './NotificationsList';
import { Api } from '../../api/Api';
import GetAPIHeader from '../../api/ApiCaller';
import ErrorHandling from '../../api/ErrorHandling';
import Loading from '../../components/Loading/loading';
import { withTranslation } from 'react-i18next';
import SlimLoader from '../../components/SlimLoader/slimLoader';
import StorageUtils from '../../containers/utils/StorageUtils';
import {connect} from 'react-redux';
import {setWarningPopupStatus} from '../../redux/actions/commonActions';

const Storage = new StorageUtils();
class Notifications extends React.Component {
    _isMounted = false;
    constructor(props) {
        super(props);

        this.state = {
            unReadCount: '',
            importantCount: '',
            generalCount: '',
            language: "en",
            loading: 0,
            tabName: 'all',
            todoList: []
        }
    }

    componentDidMount() {
        const {dispatch} = this.props;
        dispatch(setWarningPopupStatus(false));
        this._isMounted=true;
        let th = this;
        th.getNotificationCount();
        $(document).ready(function () {
            $('a[data-toggle="tab"]').on("shown.bs.tab", function (e) {
                if($(e.target).attr("href") === "#nav-all") {
                    th.setState({ tabName: 'all' });
                } else {
                    th.setState({ tabName: 'notAll' });
                }
            })
        })
    }


    getNotificationCount() {
        let th = this;
        new Api(GetAPIHeader(Storage.getAccessToken())).v31.getNotificationsStats()
            .then(response => {
                th.setState({ unReadCount: response.Unread, importantCount: response.Important, generalCount: response.General, loading: 0 })
            }).catch((err) => {
                ErrorHandling(err)
                this.setState({ loading: 0 });
            });
    }

    render() {
        const { t } = this.props;
        const { tabName } = this.state;
        return (
            <div>
                {this.state.loading ? (
                    <>
                        <SlimLoader isAnimating={!this._isMounted} />
                        <Loading Height="0" />
                    </>
                ) : (
                    <div className="container">
                        <h3 className="page-header">{t('notifications.notifications')}</h3>
                        <nav>
                            <div className="nav nav-tabs app-tabs" id="nav-tab" role="tablist">
                                <a className="nav-item nav-link active" id="nav-all-tab"
                                    data-toggle="tab" href="#nav-all" role="tab" aria-controls="nav-all"
                                    aria-selected="false">{t('notifications.all')}</a>

                                <a className="nav-item nav-link" id="nav-important-tab"
                                    data-toggle="tab" href="#nav-important" role="tab" aria-controls="nav-important"
                                    aria-selected="false">{t('notifications.important')} 
                                    {this.state.importantCount > 0 && <span style={{"padding":"5px 10px 2.5px"}}>{this.state.importantCount}</span>}</a>

                                <a className="nav-item nav-link" id="nav-unread-tab"
                                    data-toggle="tab" href="#nav-unread" role="tab" aria-controls="nav-unread"
                                    aria-selected="false">{t('notifications.unread')} 
                                    {this.state.unReadCount > 0 && <span style={{"padding":"5px 10px 2.5px"}} >{this.state.unReadCount}</span>}</a>

                                <a className="nav-item nav-link" id="nav-general-tab"
                                    data-toggle="tab" href="#nav-general" role="tab" aria-controls="nav-general"
                                    aria-selected="false">{t('notifications.general')} 
                                    {this.state.generalCount > 0 && <span style={{"padding":"5px 10px 2.5px"}} >{this.state.generalCount}</span>}</a>

                            </div>
                        </nav>

                        <div className="tab-content" id="nav-tabContent" style={{ padding: "0" }}>
                            <div className="tab-pane fade show active" id="nav-all" role="tabpanel"
                                aria-labelledby="nav-all-tab">
                                <NotificationsList
                                    read={0}
                                    tabName={tabName}
                                    notificationsCount={this.getNotificationCount.bind(this)}
                                />
                            </div>
                            <div className="tab-pane fade" id="nav-important" role="tabpanel"
                                aria-labelledby="nav-important-tab">
                                <NotificationsList notificationsCount={this.getNotificationCount.bind(this)}
                                  read={3} tabName={tabName}/>
                            </div>
                            <div className="tab-pane fade" id="nav-unread" role="tabpanel"
                                aria-labelledby="nav-unread-tab">
                                <NotificationsList notificationsCount={this.getNotificationCount.bind(this)}
                                  read={2} tabName={tabName}/>
                            </div>
                            <div className="tab-pane fade" id="nav-general" role="tabpanel"
                                aria-labelledby="nav-general-tab">
                                <NotificationsList notificationsCount={this.getNotificationCount.bind(this)}
                                  read={4} tabName={tabName}/>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    }
}

export default withTranslation('translation')((connect())(withRouter(Notifications)));
