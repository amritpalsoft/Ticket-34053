import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import { Api } from '../../api/Api';
import GetAPIHeader from '../../api/ApiCaller';
import ErrorHandling from '../../api/ErrorHandling';
import moment from 'moment';
import InfiniteScroll from 'react-infinite-scroller';
import Loading from '../../components/Loading/loading';
import {
    ToastsContainer,
    ToastsContainerPosition,
    ToastsStore,
} from "react-toasts";
import ImageUtils from '../../components/Utils/ImageUtils/ImageUtils';
import Modal from 'react-bootstrap/Modal';
import StarRatings from 'react-star-ratings';
import { getRelativeTime } from '../../constants/constants';
import 'react-quill/dist/quill.snow.css';
import FilledDatePicker from '../../components/FilledDatePicker/FilledDatePicker';
import { LocalDateTime, addDay, getMonthNameWithDate } from '../../constants/constants';
import Slider from '@material-ui/core/Slider';
import { withStyles } from '@material-ui/core/styles';
import { withRouter } from "react-router-dom";
import EmptyImage from '../../assets/images/No data-cuate.svg';
import LogoutModal from '../../components/Modal/LogoutDialog';
import $, { each } from 'jquery';
import StorageUtils from '../../containers/utils/StorageUtils';
import NotificationModal from '../../components/Modal/notificationModal';
import MatrixPreviewTable from './MatrixPreviewTable';

const Storage = new StorageUtils();
const iOSBoxShadow = '0 3px 1px rgba(0,0,0,0.1),0 4px 8px rgba(0,0,0,0.13),0 0 0 1px rgba(0,0,0,0.02)';
const maxLength = 500;
var qs = require('qs');

const IOSSlider = withStyles({
    root: {
        color: '#3880ff',
        height: 2,
        padding: '15px 0',
    },
    thumb: {
        height: 18,
        width: 18,
        backgroundColor: '#0062ff',
        marginTop: -6,
        marginLeft: -4,
        '&:focus, &:hover, &$active': {
            boxShadow: '0 3px 1px rgba(0,0,0,0.1),0 4px 8px rgba(0,0,0,0.3),0 0 0 1px rgba(0,0,0,0.02)',
            // Reset on touch devices, it doesn't add specificity
            '@media (hover: none)': {
                boxShadow: iOSBoxShadow,
            },
        },
    },
    active: {},
    valueLabel: {
        left: 'calc(-50% + 2px)',
        top: -22,
        '& *': {
            background: 'transparent',
            color: '#0062ff',
        },
    },
    track: {
        height: 8,
        borderRadius: 4,
        backgroundColor: '#e8f1ff',
        border: "1px solid #0062ff"
    },
    rail: {
        height: 8,
        borderRadius: 4,
        backgroundColor: '#F2F2F2',
        border: "1px solid #b5bbc1"
    },
    mark: {
        backgroundColor: '#bfbfbf',
        height: 8,
        width: 1,
        marginTop: -3,
    },
    markActive: {
        opacity: 1,
        backgroundColor: 'currentColor',
    },
})(Slider);

class SurveyList extends Component {

    constructor(props) {
        super(props);
        this.state = {
            surveyList: [],
            loading: false,
            surveyType: "allSurvey",
            openParticipateSurveyModal: false,
            surveyQuestionsData: null,
            pageNumber: 1,
            pageSize: 5,
            theme: 'snow',
            selectedSmileArr: [],
            finalAnswersArr: [],
            openDatePicker: false,
            date: new Date(),
            guid: '',
            editAnswersMode: false,
            popupType: '',
            surveyCanceLoading: false,
            surveyErrMsg: "",
            renderNotificationModal: false,
            showSurveyModal: false,
            surveyModalId: ""
        }
    }

    componentDidMount() {
        const { pageNumber, pageSize, surveyType } = this.state;
        this.getSurveyData(pageNumber, pageSize, surveyType);
        const { history } = this.props;
        if(history && history.location && history.location.state && history.location.state.notificationType){
            if(history.location.state.notificationType === "SurveyCancel"){
                this.setState({renderNotificationModal: true})
            } else {
                this.setState({
                    surveyLoading: true,
                    openParticipateSurveyModal: true,
                })
                this.getSurveyQuestions(history.location.state.notificationId);
            } 
        } else{
            if (this.props.location.search) {
                let queryParam = qs.parse(this.props.location.search, { ignoreQueryPrefix: true });
                if(queryParam.id) {
                    this.setState({
                        surveyLoading: true,
                        openParticipateSurveyModal: true,
                    })
                    this.getSurveyQuestions(queryParam.id);
                }
            }
        }
        let queryParam = qs.parse(this.props.location.search, { ignoreQueryPrefix: true });
        if(queryParam && queryParam.surveyModalId) {
            this.setState({surveyModalId: queryParam.surveyModalId, showSurveyModal: true});
        }
    }
    handleNotificationModalClose = () => { 
        this.setState({renderNotificationModal: false});
        this.props.history.push('/survey');
    }

    getSurveyData(pageNumber, pageSize, surveyType, type) {
        if (type !== "pagination") {
            this.setState({ loading: true });
        }
        new Api(GetAPIHeader(Storage.getAccessToken())).v31
            .surveyResponseGetAssigned({
                pageNumber: pageNumber,
                pageSize: pageSize,
                selfcreated: surveyType === "allSurvey" ? 0 : 1
            })
            .then((response) => {
                let aggregatedResponse;
                if (type === "pagination") {
                    aggregatedResponse = [...this.state.surveyList, ...response];
                } else {
                    aggregatedResponse = response;
                }
                this.setState({
                    surveyList: aggregatedResponse,
                    loading: false,
                    pageNumber: pageNumber,
                    hasMore: response.length < 5 ? false : true,
                })
            })
        .catch((err) => {				
            ErrorHandling(err);
            });
    }


    loadFunc = () => {
        const { pageNumber, pageSize, surveyType } = this.state;
        this.getSurveyData(pageNumber + 1, pageSize, surveyType, "pagination");
    }

    getSurveyQuestions(sid) {
        const { t } = this.props;
        new Api(GetAPIHeader(Storage.getAccessToken())).v31
            .surveyResponseGet(sid)
            .then((response) => {
                if (response.Message) {

                } else {
                    this.setState({
                        surveyQuestionsData: response,
                        surveyLoading: false,
                        submitUid: sid,
                        sectionUid: response && response.sections && response.sections[0] && response.sections[0].sguid
                    })
                }
                this.setState({
                    surveyLoading: false,
                    submitUid: sid,
                    sectionUid: response && response.sections && response.sections[0] && response.sections[0].sguid
                })
            })
        .catch((err) => {				
          ErrorHandling(err)
          console.log("err --->", err);
          if (err.Message) {
            if (err.Message === "UNINVITED") {
                this.setState({ surveyLoading: false, surveyErrMsg: t('survey.nonParticipantSurveyErr') });
            }
            if (err.Message === "CREATOR") {
                this.setState({ surveyLoading: false, surveyErrMsg: t('survey.ownerSurveyErr') });
            }
        }
            });
    }

    onParticipateClick = (item, indx) => {
        this.setState({
            surveyLoading: true,
            openParticipateSurveyModal: true,
        })
        this.getSurveyQuestions(item.sguid);
    }

    handleChange = (evt) => {
        this.setState({
            [evt.target.name]: evt.target.value
        }, this.getSurveyData(1, 5, evt.target.value))
    }

    renderSelect() {
        const { t } = this.props;
        const { surveyType } = this.state;
        return (
            <div className="d-flex justify-content-end mb-2">
                <div>
                    <select className="survey_select" name="surveyType" value={surveyType} onChange={this.handleChange}>
                        <option value="allSurvey">{t("survey.allSurvey")}</option>
                        <option value="mySurvey">{t("survey.mySurvey")}</option>
                    </select>
                </div>
            </div>
        )
    }

    editcancelOrDate = (item, popupType) => {
        if (popupType === 'date') {
            this.setState({ openDatePicker: true, date: item.dueDate, guid: item.sguid });
        } else {
            this.setState({ showConfirmationModal: true, guid: item.sguid });
        }
        this.setState({ popupType: popupType });
    }

    changeDuedate = (date) => {
        const {surveyType}=this.state;
        this.setState({loading: 1})
        const {guid} = this.state;
        var dueDate = {"dueDate": date,"reason":""}
        new Api(GetAPIHeader(Storage.getAccessToken())).v31.sendSurveyChangeDueDate(guid, dueDate)
            .then(response => {
                this.getSurveyData(1, 5, surveyType);
                ToastsStore.success("Date Updated Successfully");
            this.setState({openDatePicker: false})
        }).catch((err) => {				
            ErrorHandling(err)
            this.setState({loading: 0})
                ToastsStore.error(err.Message || "Something went wrong!", 3000);
            });
    }

    acceptClick = (val) => {
        var convertedDate = LocalDateTime(val)
        this.changeDuedate(convertedDate);
    }

    handleQuestionChange(evt, survey) {
        const { finalAnswersArr, surveyQuestionsData } = this.state;
        let surQueData = surveyQuestionsData && surveyQuestionsData.sections.length > 0 && surveyQuestionsData.sections[0];
        let sQuestions = surQueData && surQueData["questions"];
        const sIndx = sQuestions.findIndex(el => el.sguid === survey.sguid);
        if (sIndx > -1) {
            sQuestions[sIndx].simple.answerText = evt.target.value;
        }
        const qIndx = finalAnswersArr.findIndex(el => el.questionSguid === survey.sguid);
        let textObj = {
            questionSguid: survey.sguid,
            comments: null,
            questionType: "questionsimple",
            simple: {
                answerText: evt.target.value
            },
            scale: null,
            multipleChoice: null,
            matrix: null,
            rating: null
        };
        if (qIndx > -1) {
            finalAnswersArr[qIndx] = textObj;
        } else {
            finalAnswersArr.push(textObj);
        }
        this.setState({ finalAnswersArr: finalAnswersArr, surveyQuestionsData: surveyQuestionsData });

    }

    handleDateChange(date, survey) {
        const { finalAnswersArr, surveyQuestionsData } = this.state;
        let surQueData = surveyQuestionsData && surveyQuestionsData.sections.length > 0 && surveyQuestionsData.sections[0];
        let sQuestions = surQueData && surQueData["questions"];
        const sIndx = sQuestions.findIndex(el => el.sguid === survey.sguid);
        if (sIndx > -1) {
            sQuestions[sIndx].simple.answerText = getMonthNameWithDate(date);
        }
        const qIndx = finalAnswersArr.findIndex(el => el.questionSguid === survey.sguid);
        let textObj = {
            questionSguid: survey.sguid,
            comments: null,
            questionType: "questionsimple",
            simple: {
                answerText: getMonthNameWithDate(date)
            },
            scale: null,
            multipleChoice: null,
            matrix: null,
            rating: null
        };
        if (qIndx > -1) {
            finalAnswersArr[qIndx] = textObj;
        } else {
            finalAnswersArr.push(textObj);
        }
        this.setState({ finalAnswersArr: finalAnswersArr, surveyQuestionsData: surveyQuestionsData });

    }

    pickRatingType(type) {
        switch (type) {
            case 1:
                return 'Star';
            case 2:
                return 'Smile';
            case 3:
                return 'Slider';
        }
    }

    changeRating(newRating, survey) {
        const { finalAnswersArr, surveyQuestionsData } = this.state;
        let surQueData = surveyQuestionsData && surveyQuestionsData.sections.length > 0 && surveyQuestionsData.sections[0];
        let sQuestions = surQueData && surQueData["questions"];
        const sIndx = sQuestions.findIndex(el => el.sguid === survey.sguid);
        if (sIndx > -1) {
            sQuestions[sIndx].rating.AnswerValue = newRating;
        }
        const qIndx = finalAnswersArr.findIndex(el => el.questionSguid === survey.sguid);
        let ratingObj = {
            questionSguid: survey.sguid,
            comments: null,
            questionType: "questionrating",
            simple: null,
            scale: null,
            multipleChoice: null,
            matrix: null,
            rating: {
                value: newRating,
                ratingType: 1
            }
        };
        if (qIndx > -1) {
            finalAnswersArr[qIndx] = ratingObj;
        } else {
            finalAnswersArr.push(ratingObj);
        }
        this.setState({
            finalAnswersArr: finalAnswersArr
        });
    }

    onSliderChange(evt, val, survey) {
        const { finalAnswersArr, surveyQuestionsData } = this.state;
        let surQueData = surveyQuestionsData && surveyQuestionsData.sections.length > 0 && surveyQuestionsData.sections[0];
        let sQuestions = surQueData && surQueData["questions"];
        const sIndx = sQuestions.findIndex(el => el.sguid === survey.sguid);
        if (sIndx > -1) {
            sQuestions[sIndx].rating.AnswerValue = val;
        }
        const qIndx = finalAnswersArr.findIndex(el => el.questionSguid === survey.sguid);
        let ratingObj = {
            questionSguid: survey.sguid,
            comments: null,
            questionType: "questionrating",
            simple: null,
            scale: null,
            multipleChoice: null,
            matrix: null,
            rating: {
                value: val,
                ratingType: 3
            }
        };
        if (qIndx > -1) {
            finalAnswersArr[qIndx] = ratingObj;
        } else {
            finalAnswersArr.push(ratingObj);
        }
        this.setState({
            finalAnswersArr: finalAnswersArr
        });
    }

    onSelectSinglechoice = (item, indx, survey) => {
        const { finalAnswersArr, surveyQuestionsData } = this.state;
        const qIndx = finalAnswersArr.findIndex(el => el.questionSguid === survey.sguid);
        let surQueData = surveyQuestionsData && surveyQuestionsData.sections.length > 0 && surveyQuestionsData.sections[0];
        let sQuestions = surQueData && surQueData["questions"];
        const sIndx = sQuestions.findIndex(el => el.sguid === survey.sguid);

        sQuestions[sIndx].multipleChoice.values.map((x, i) => {
            if (indx === i) x.isSelected = true;
            else x.isSelected = false;
        })
        let singlechoiceObj = {
            questionSguid: survey.sguid,
            comments: null,
            questionType: "questionmultichoice",
            simple: null,
            scale: null,
            multipleChoice: {
                values: [
                    {
                        value: item.value,
                        isSelected: true
                    }
                ]
            },
            matrix: null,
            rating: null
        };

        if (qIndx > -1) {
            finalAnswersArr[qIndx] = singlechoiceObj;
        } else {
            finalAnswersArr.push(singlechoiceObj);
        }
        this.setState({ finalAnswersArr: finalAnswersArr });
    }

    onSelectMultichoice = (item, indx, survey) => {
        const { finalAnswersArr, surveyQuestionsData } = this.state;
        const qIndx = finalAnswersArr.findIndex(el => el.questionSguid === survey.sguid);
        let existedChoice = finalAnswersArr[qIndx];
        let choiceArr = qIndx > -1 ? existedChoice.multipleChoice.values : [];
        let surQueData = surveyQuestionsData && surveyQuestionsData.sections.length > 0 && surveyQuestionsData.sections[0];
        let sQuestions = surQueData && surQueData["questions"];
        const sIndx = sQuestions.findIndex(el => el.sguid === survey.sguid);
        sQuestions[sIndx].multipleChoice.values.map((x, i) => {
            if (indx === i) {
                x.isSelected = !x.isSelected;
            }
        })

        const isOptionExists = choiceArr.some(el => el.value.toLowerCase() === item.value.toLowerCase());
        if (isOptionExists) {
            const findIndx = choiceArr.findIndex(el => el.value.toLowerCase() === item.value.toLowerCase());
            choiceArr.splice(findIndx, 1);
        } else {
            choiceArr.push({
                id: indx,
                value: item.value,
                isSelected: true
            })
        }

        let multichoiceObj = {
            questionSguid: survey.sguid,
            comments: null,
            questionType: "questionmultichoice",
            simple: null,
            scale: null,
            multipleChoice: {
                values: choiceArr
            },
            matrix: null,
            rating: null
        };
        if (qIndx > -1) {
            if (choiceArr.length > 0) {
                finalAnswersArr[qIndx] = multichoiceObj;
            } else {
                finalAnswersArr.splice(qIndx, 1);
            }
        } else {
            finalAnswersArr.push(multichoiceObj);
        }
        this.setState({
            finalAnswersArr: finalAnswersArr
        })
    }

    onSmileChange(survey, type) {
        const { finalAnswersArr, surveyQuestionsData } = this.state;
        let surQueData = surveyQuestionsData && surveyQuestionsData.sections.length > 0 && surveyQuestionsData.sections[0];
        let sQuestions = surQueData && surQueData["questions"];
        const sIndx = sQuestions.findIndex(el => el.sguid === survey.sguid);
        if (sIndx > -1) {
            sQuestions[sIndx].rating.AnswerValue = type;
        }
        let ratingObj = {
            questionSguid: survey.sguid,
            comments: null,
            questionType: "questionrating",
            simple: null,
            scale: null,
            multipleChoice: null,
            matrix: null,
            rating: {
                value: type,
                ratingType: 2
            }
        };

        const qIndx = finalAnswersArr.findIndex(el => el.questionSguid === survey.sguid);
        if (qIndx > -1) {
            finalAnswersArr[qIndx] = ratingObj;
        } else {
            finalAnswersArr.push(ratingObj);
        }
        this.setState({ finalAnswersArr: finalAnswersArr });
    }
    returnMatrixData(matrix, survey){
        const {finalAnswersArr} = this.state;
        var matrixfinalObj = {selected: matrix}
        let matrixObj = {
            questionSguid: survey.sguid,
            comments: null,
            questionType: "questionmatrix",
            simple: null,
            scale: null,
            multipleChoice: null,
            matrix: matrixfinalObj,
            rating: null
        };
        const qIndx = finalAnswersArr.findIndex(el => el.questionSguid === survey.sguid);
        if(qIndx > -1) {
            finalAnswersArr[qIndx]=matrixObj;
        } else {
            finalAnswersArr.push(matrixObj);
        }
        this.setState({ finalAnswersArr: finalAnswersArr });
    }

    renderQuestionTypeField(eachSurvey) {
        const {t}=this.props;
        const {editAnswersMode} = this.state;
        if(eachSurvey.questionType == "questionsimple" && eachSurvey.simple.regName === "None") {
            return (
                <div className="col-8 col-md-8 pt-3 pl-0">
                    <textarea className="form-control form-control-md normal normal-cursor"
                        id="answerText" rows="3"
                        name="answerText"
                        maxLength="500"
                        placeholder={t('survey.enterDescription')}
                        onChange={(evt) => this.handleQuestionChange(evt, eachSurvey)}
                        value={eachSurvey.simple.answerText || ""}>
                    </textarea>

                    <div className="row">
                        <div className="col-md-12">
                            <small className="float-right" style={{ color: "#666", fontSize: '10px' }}>{(eachSurvey.simple.answerText && eachSurvey.simple.answerText.length) || 0} / {maxLength}</small>
                        </div>
                    </div>
                </div>
            )
        }
        if (eachSurvey.questionType === "questionsimple" && eachSurvey.simple.regName === "Date") {
            return (
                <div className="col-6 px-0">
                    <label for="date" className="normal mt-3">{t('survey.selectDate')}</label>
                    <FilledDatePicker
                        formLabel={""}
                        value={eachSurvey.simple.answerText || new Date()}
                        disablePast={false}
                        name='date'
                        onChange={(evt) => this.handleDateChange(evt, eachSurvey)}
                        className="bg-white border normal"
                    />
                </div>
            )
        }
        if (eachSurvey.questionType === "questionmultichoice") {
            return (
                eachSurvey.multipleChoice.values.map((item, indx) => {
                    return (
                        <div className="col-8 pt-3 pl-0" key={indx}>
                            <div className="d-flex align-items-center ml-n3">
                                {eachSurvey.multipleChoice.isMultipleSelection ?
                                    <input className="position-relative"
                                        key={item.order}
                                        style={{ left: "32px" }}
                                        type="checkbox"
                                        name={eachSurvey.sguid}
                                        id={item.order}
                                        value={item.value}
                                        checked={item.isSelected}
                                        onClick={() => this.onSelectMultichoice(item, indx, eachSurvey)}
                                    /> :
                                    <input className="position-relative"
                                        key={item.order}
                                        style={{ left: "32px" }}
                                        type="radio"
                                        name={eachSurvey.sguid}
                                        id={item.order}
                                        value={item.value}
                                        checked={item.isSelected}
                                        onClick={() => this.onSelectSinglechoice(item, indx, eachSurvey)}
                                    />}
                                <input
                                    type="text"
                                    style={{ pointerEvents: "none" }}
                                    className={item.isSelected ? "form-control form-control-md normal bg-white text-primary input-field border-gray pl-5" :
                                        "form-control form-control-md normal bg-white input-field border-gray pl-5"}
                                    id="suveyChoice"
                                    name="suveyChoice"
                                    autoComplete="off"
                                    maxLength={75}
                                    defaultValue={item.value.charAt(0).toUpperCase() + item.value.slice(1)}
                                />
                            </div>
                        </div>
                    )
                })
            )
        }

        if (eachSurvey.questionType == "questionrating") {
            if (eachSurvey.rating) {
                let ratingType = this.pickRatingType(eachSurvey.rating.ratingType);
                if (ratingType == "Star") {
                    return (
                        <div className="col-5 pt-3 pl-0">
                            <StarRatings
                                rating={Number(eachSurvey.rating.AnswerValue)}
                                starRatedColor="#0062ff"
                                numberOfStars={5}
                                starDimension="28px"
                                changeRating={(evt) => this.changeRating(evt, eachSurvey)}
                                name="rating"
                                starSpacing="14px"
                                starHoverColor="#0062ff"
                            />
                            <div className="col-12 d-flex px-0 justify-content-between">
                                <p>{eachSurvey.rating.minValue}</p>
                                <p>{eachSurvey.rating.maxValue}</p></div>
                        </div>
                    )
                }

                if (ratingType == "Smile") {
                    return (
                        <div className="col-4 pt-3 pl-0">
                            <div className="d-flex justify-content-between align-items-center" style={{ fontSize: 38 }}>
                                <div className="d-flex flex-column align-items-center">
                                    <i className={eachSurvey.rating.AnswerValue === "poor" ? "fal fa-frown pointer text-primary" : "fal fa-frown pointer text-gray"}
                                        onClick={() => this.onSmileChange(eachSurvey, 'poor')}
                                    />
                                        <p  style={{ fontFamily: 'Inter' }} className={eachSurvey.rating.AnswerValue !== "poor" ?"normal font-weight-light text-gray mt-1 ml-1":"normal font-weight-light text-primary mt-1 ml-1"} >{t('survey.poor')}</p>
                                </div>
                                <div className="d-flex flex-column align-items-center">
                                    <i className={eachSurvey.rating.AnswerValue === "okay" ? "fal fa-meh text-primary pointer" : "fal fa-meh text-gray pointer"}
                                        onClick={() => this.onSmileChange(eachSurvey, 'okay')}
                                    />
                                    <p  style={{ fontFamily: 'Inter' }} className={eachSurvey.rating.AnswerValue !== "okay" ?"normal font-weight-light text-gray mt-1 ml-1":"normal font-weight-light text-primary mt-1 ml-1"} >{t('survey.okay')}</p>
                                </div>
                                <div className="d-flex flex-column align-items-center">
                                    <i className={eachSurvey.rating.AnswerValue === "good" ? "fal fa-smile text-primary pointer" : "fal fa-smile text-gray pointer"}
                                        onClick={() => this.onSmileChange(eachSurvey, 'good')}
                                    />
                                    <p  style={{ fontFamily: 'Inter' }} className={eachSurvey.rating.AnswerValue !== "good" ?"normal font-weight-light text-gray mt-1 ml-1":"normal font-weight-light text-primary mt-1 ml-1"} >{t('survey.good')}</p>
                                </div>
                            </div>
                        </div>
                    )
                }

                if (ratingType == "Slider") {
                    return (
                        <div className="col-7 pt-3 pl-0">
                            <div className="d-flex justify-content-between pt-1">
                                <small>{eachSurvey.rating && eachSurvey.rating.minValue}</small>
                                <small>{eachSurvey.rating && eachSurvey.rating.maxValue}</small>
                            </div>
                            <div className="input-range">
                                <IOSSlider step={1} min={0} max={10}
                                    valueLabelDisplay="on" defaultValue={eachSurvey.rating && eachSurvey.rating.AnswerValue && Number(eachSurvey.rating.AnswerValue)}
                                    onChange={(evt, val) => this.onSliderChange(evt, val, eachSurvey)}
                                />
                            </div>
                            
                        </div>
                    )
                }
            }
            
        }
        if(eachSurvey.questionType === "questionmatrix"){
            //Adding selected column to relavant rows while editing
            if(editAnswersMode && eachSurvey.matrix.rows.length > 0){
                eachSurvey.matrix.rows.map((eachrow, rowIndex)=>{
                    eachSurvey.matrix.answers.length > 0 &&
                    eachSurvey.matrix.answers.map((eachAns)=>{
                        if(eachrow.title === eachAns.rowTitle){
                            eachrow.selectedCol = eachAns.colTitle
                            eachAns.rowIndex = rowIndex
                        }
                    })
                })
            }
            return <MatrixPreviewTable 
                        rowLabel={eachSurvey.matrix.rows} 
                        columnLabel={eachSurvey.matrix.columns} 
                        answers={eachSurvey.matrix.answers}
                        editAnswersMode= {editAnswersMode}
                        participate={true}
                        survey={eachSurvey}
                        returnMatrixData={this.returnMatrixData.bind(this)}/>
        }
    }

    disableButton() {
        const { finalAnswersArr, surveyQuestionsData } = this.state;
        let surQueData = surveyQuestionsData && surveyQuestionsData.sections !== null && surveyQuestionsData.sections.length > 0 && surveyQuestionsData.sections[0];
        let sQuestions = surQueData && surQueData["questions"];
        if (finalAnswersArr.length < (sQuestions && sQuestions.length)) {
            return true;
        } else {
            let simpleObj = finalAnswersArr.find(item => item.questionType === "questionsimple");
            let multiObj = finalAnswersArr.find(item => item.questionType === "questionmultichoice");
            let matrixObj = finalAnswersArr.find(item => item.questionType === "questionmatrix");
            if(simpleObj && !simpleObj.simple.answerText) {
                return true;
            } else if (multiObj && multiObj.multipleChoice && multiObj.multipleChoice.values && multiObj.multipleChoice.values.length == 0) {
                return true;
            } else if(matrixObj && matrixObj.matrix && matrixObj.matrix.length === 0){
                return true
            } else {
                return false;
            }
        }
    }

    onSubmitSurvey = () => {
        const {t}=this.props;
        const { finalAnswersArr, submitUid, sectionUid, editAnswersMode }=this.state;
        this.setState({submitting: true})
        finalAnswersArr.length > 0 && finalAnswersArr.map((eachSurvey)=>{
            if(eachSurvey.questionType === "questiomatrix"){
                eachSurvey.matrix.selected.length > 0 && eachSurvey.matrix.selected.map((eachMatrix)=>{
                    delete eachMatrix["title"]
                    delete eachMatrix["order"]
                    delete eachMatrix["rowIndex"]
                    delete eachMatrix["selectedCol"]
                })
            }
        })
        let reqPayload = [{
            sectionSguid: sectionUid,
            answers: finalAnswersArr
        }];
        new Api(GetAPIHeader(Storage.getAccessToken())).v31
        .surveyResponseSave(submitUid, reqPayload, {isAnswerEdit: editAnswersMode })
            .then((response) => {
                ToastsStore.success(t('survey.surveySubmitted'));
                setTimeout(() => {
                    this.setState({
                        openParticipateSurveyModal: false,
                        submitting: false,
                        editAnswersMode: false,
                        finalAnswersArr: []
                    })
                    this.getSurveyData(1, 5, "allSurvey");
                }, 1500);
            })
        .catch((err) => {				
            ErrorHandling(err)
            });

    }
    modalHide = () => {
        this.setState({ surveyCanceLoading: true });
        const { t } = this.props;
        const { popupType, guid, pageNumber, pageSize, surveyType } = this.state;
        if (popupType === 'cancel') {
            new Api(GetAPIHeader(Storage.getAccessToken())).v31
                .sendSurveyCancel(guid, { reason: 'yes' })
                .then((response) => {
                    ToastsStore.success(t('survey.surveyCanceldSuccess', 3000));
                    setTimeout(() => {
                        this.setState({
                            openParticipateSurveyModal: false, editAnswersMode: false, showConfirmationModal: false,
                            finalAnswersArr: [], surveyCanceLoading: false
                        });
                        this.getSurveyData(pageNumber, pageSize, surveyType);
                        $("#myModal").modal("hide");
                    }, 2000)

                }).catch((err) => {
                    ToastsStore.error(err.Message || "Something went wrong!", 3000);
                    this.setState({ surveyCanceLoading: false })
                });
        } else {
            this.setState({openParticipateSurveyModal: false, editAnswersMode: false, showConfirmationModal: false, finalAnswersArr: [], surveyCanceLoading: false });
            this.props.history.push('/survey');
            $("#myModal").modal("hide");
        }
    }
    displayConfirmationModel() {
        const { finalAnswersArr } = this.state;
        if (finalAnswersArr && finalAnswersArr != null && finalAnswersArr !== "" && finalAnswersArr !== undefined && finalAnswersArr.length > 0) {
            this.setState({ showConfirmationModal: true });
        } else {
            this.setState({ openParticipateSurveyModal: false, editAnswersMode: false, showConfirmationModal: false, finalAnswersArr: [] });
        }
    }

    checkConfirmationDisplay(){
        const {surveyQuestionsData} = this.state;
        if(surveyQuestionsData !== null && surveyQuestionsData.isSurveyCancelled === true ){
            this.setState({ openParticipateSurveyModal: false, editAnswersMode: false, showConfirmationModal: false, finalAnswersArr: [] });
        }else{
            this.displayConfirmationModel();
        }
    }

    renderParticipateSurveyModal() {
        const {t}=this.props;
        const {openParticipateSurveyModal,surveyLoading, surveyQuestionsData, surveyErrMsg, editAnswersMode, submitting}=this.state;
        let surQueData=surveyQuestionsData &&surveyQuestionsData.sections !== null && surveyQuestionsData.sections.length > 0 && surveyQuestionsData.sections[0];
        let sQuestions = surQueData && surQueData["questions"];
        return (
            <Modal
                show={openParticipateSurveyModal}
                centered
                size="lg"
                animation={false}
                aria-labelledby="contained-modal-title-vcenter"
                className="survey_modal"
                onHide={() => this.checkConfirmationDisplay()}>
                
                        {
                        <div className="col-md-12 pt-2 px-0 pb-3 bg-white">
                            <div className="d-flex align-items-center justify-content-between modal-title">
                                <h6 className="mt-2 ml-4 font-weight-bold xlarge">{t('survey.participateInSurvey')}</h6>
                                <div className="pr-4">
                                    <i className="fal fa-times fa-xs text-gray pointer mt-1 p-2 close_ic"
                                        onClick={() => this.displayConfirmationModel()}></i>
                                </div>
                        </div>
                        <div className="pt-2 mr-3">
                            <Modal.Body scrollable="true">
                                {surveyLoading ? <Loading /> :
                                    surveyQuestionsData !== null && surveyQuestionsData.isSurveyCancelled === true ?

                                        <div className="d-flex justify-content-center mt-5">
                                            <div>
                                                <div className="d-flex justify-content-center">
                                                    <img alt="" src={EmptyImage} style={{ height: '260px' }} /></div>
                                                <p className="text-center my-4 font-weight-bold normal">{t('survey.surveyCancelledEditAnswers')}</p></div>
                                        </div> :
                                        sQuestions ?
                                        <div className="row ml-5 mr-3">
                                                <div style={{ height: 450, overflow: 'scroll' }} className="w-100">
                                                    <p className="text-gray pl-2">{t('survey.new')} {surveyQuestionsData && surveyQuestionsData.templateCategoryName} {t('survey.survey')}</p>
                                                    <h4 className="font-weight-bold text-black pl-2 pt-1">{surveyQuestionsData && surveyQuestionsData.surveyTitle}</h4>
                                                    <p className="small text-gray pl-2 pre-wrap">{surveyQuestionsData && surveyQuestionsData.surveyTemplateDesc}</p>
                                                    {
                                                        sQuestions.length > 0 &&
                                                        sQuestions.map((eachSurvey, i) => {
                                                            return (
                                                                <div key={i} className="col-md-12 pl-2 pt-0 pb-1 pr-2" style={{ overflow: 'scroll' }}>
                                                                    <div className="d-flex justify-content-between">
                                                                        <h6 className="font-weight-normal text-primary pt-4">{t('survey.question')} {i + 1}</h6>
                                                                    </div>
                                                                    <p className="mt-0 font-weight-bold text-black">{eachSurvey.questionText}</p>
                                                                    <div>
                                                                        {this.renderQuestionTypeField(eachSurvey)}
                                                                    </div>
                                                                </div>
                                                            )
                                                        })
                                                    }
                                                </div>
                                            </div> :
                                        <div className="d-flex flex-column align-items-center mt-5">
                                                <img alt="" src={EmptyImage} style={{height: '260px'}}/>
                                                <p className="text-center my-4 font-weight-bold normal">{surveyErrMsg ? surveyErrMsg : t('survey.adyRespondes')}</p>
                                        </div> 
                                }
                            </Modal.Body>
                        </div>
                        {sQuestions && surveyQuestionsData !== null && surveyQuestionsData.isSurveyCancelled !== true &&
                            <div className="modal-bottom">
                                <div className="row pt-3 pb-3">
                                    <div className="col-md-12 px-0">
                                        {!surveyLoading &&
                                            <div className="d-flex justify-content-between align-items-center ml-5 mr-5">
                                                <p className="text-gray x-small">(i)<span className="ml-2">{editAnswersMode ? t('survey.editTextInfo') : t('survey.surveyModalBottomTxt')}</span></p>
                                                <button className={this.disableButton() ?
                                                    "py-2 px-4 app-blue-badge-pill bg-dark-gray btn-border-radius normal border-0" :
                                                    "py-2 px-4 btn-primary btn-border-radius normal border-0"}
                                                    onClick={this.onSubmitSurvey}
                                                    disabled={this.disableButton() || submitting}>
                                                    <span className={this.disableButton() ? "text-gray large" : "text-white large"}>
                                                        {t('common.submit')}
                                                    </span>
                                                    {submitting === true &&
                                                        <span>
                                                            &nbsp;<i className="fa fa-spinner fa-sm fa-spin"></i>
                                                        </span>}
                                                </button>
                                            </div>}
                                    </div>
                                </div>
                            </div>}
                    </div>
                }
            </Modal>
        )
    }

    onEditAnswers(survey) {
        this.setState({
            surveyLoading: true,
            openParticipateSurveyModal: true,
            editAnswersMode: true,
            finalAnswersArr: []
        }, this.getSurveyQuestionsWithAnswers.bind(this, survey.sguid));
    }

    getSurveyQuestionsWithAnswers(sid) {
        const { finalAnswersArr }=this.state; 
        new Api(GetAPIHeader(Storage.getAccessToken())).v31
            .getSurveyAnswerbyId(sid)
            .then((response) => {
                let surQueData = response && response.sections.length > 0 && response.sections[0];
                let sQuestions = surQueData && surQueData["questions"];
                sQuestions.map(qstn => {
                    if (qstn.questionType === "questionmultichoice") {
                        let choiceArr = [];
                        qstn.multipleChoice.values.map(choice => {
                            if (choice.isSelected) {
                                choiceArr.push({
                                    value: choice.value,
                                    isSelected: choice.isSelected
                                })
                            }
                        })

                        let choiceObj = {
                            questionSguid: qstn.sguid,
                            comments: null,
                            questionType: "questionmultichoice",
                            simple: null,
                            scale: null,
                            multipleChoice: {
                                values: choiceArr
                            },
                            matrix: null,
                            rating: null
                        };

                        finalAnswersArr.push(choiceObj);
                    }

                    if (qstn.questionType === "questionsimple") {
                        let textObj = {
                            questionSguid: qstn.sguid,
                            comments: null,
                            questionType: "questionsimple",
                            simple: {
                                answerText: qstn.simple.answerText
                            },
                            scale: null,
                            multipleChoice: null,
                            matrix: null,
                            rating: null
                        };
                        finalAnswersArr.push(textObj);
                    }

                    if (qstn.questionType === "questionrating") {
                        let ratingObj = {
                            questionSguid: qstn.sguid,
                            comments: null,
                            questionType: "questionrating",
                            simple: null,
                            scale: null,
                            multipleChoice: null,
                            matrix: null,
                            rating: {
                                value: qstn.rating.AnswerValue,
                                ratingType: qstn.rating.ratingType
                            }
                        };
                        finalAnswersArr.push(ratingObj);
                    }
            if(qstn.questionType === "questionmatrix") {
                var matrixfinalObj = {selected: qstn.matrix && qstn.matrix.answers}
                let matrixObj = {
                    questionSguid: qstn.sguid,
                    comments: null,
                    questionType: "questionmatrix",
                    simple: null,
                    scale: null,
                    multipleChoice: null,
                    matrix: matrixfinalObj,
                    rating: null
                };
                finalAnswersArr.push(matrixObj);
            }

                })
                this.setState({
                    surveyQuestionsData: response,
                    surveyLoading: false,
                    submitUid: sid,
                    sectionUid: response && response.sections && response.sections[0] && response.sections[0].sguid
                })
            })
        .catch((err) => {				
            ErrorHandling(err)
            });
    }
    closeModal() {
        this.setState({ showConfirmationModal: false, surveyErrMsg: "", popupType: "" });
        $("#myModal").modal("hide");
    }

    renderButton(item, index) {
        const { t } = this.props;

        if (!item.selfCreatedSurvey && item.surveyStatus === "EXPIRED") return

        if (item.selfCreatedSurvey) {
            return (
                <button className="button" disabled={false}
                    onClick={() => { this.props.history.push('/surveyresults', { surveyObj: item }) }}>
                    <p className="text-gray">{t('survey.viewAnswers')}</p>
                </button>
            )
        }

        if (item.surveyStatus === "COMPLETED") {
            return (
                <div className="d-flex flex-fill" style={{ wordBreak: 'break-word', overflow: 'hidden' }}>
                    <div className="mr-2 bg-light-green rounded-circle text-center d-table"
                        style={{ width: 36, height: 36 }}>
                        <i className="far fa-check-circle text-success d-table-cell align-middle"></i>
                    </div>
                    <div>
                        <p className="small font-weight-bold">{getRelativeTime(item.completedDate)}</p>
                        <p className="x-small text-gray">{t('survey.answersSubmitted')}</p>
                    </div>
                </div>
            )
        }

        return (
            <button className="button" disabled={false}
                onClick={() => this.onParticipateClick(item, index)}>
                <p className="text-primary">{t('survey.participateInSurvey')}</p>
            </button>
        )
    }

    renderEditContainer(item) {
        const { t } = this.props;
        let date = moment(item.dueDate)
        let now = moment();
        if (date < now) return;

        return (
            <div>
                <div className="line" />
                <div className="row pt-2">
                    <div className="col-md-12">
                        <div className="row d-flex align-items-center">
                            <p className="col col-lg-8 text-gray x-small">(i)<span className="ml-1">{t('survey.editTextInfo')}</span></p>
                            <div className="col col-lg-4">
                                <button className="button" disabled={false}
                                    onClick={() => this.onEditAnswers(item)}>
                                    <p className="text-primary">{t('survey.editAnswers')}</p>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    renderSurveyList() {
        const { t } = this.props;
        const { hasMore, openDatePicker, date, surveyModalId, showSurveyModal } = this.state;
        let surveyList=this.state.surveyList;
        if (surveyModalId) {
            surveyList = surveyList.filter(item => item.sguid === surveyModalId);
        } 
        return (
            <InfiniteScroll
                pageStart={0}
                loadMore={this.loadFunc}
                hasMore={showSurveyModal ? false : hasMore}
                initialLoad={false}
                loader={<div className="loader text-center" key={0}>Loading ...</div>}
            >
                {openDatePicker &&
                    <FilledDatePicker
                        formLabel={""}
                        disablePast={true}
                        open={openDatePicker}
                        value={date}
                        name='date'
                        onAccept={(val) => this.acceptClick(val)}
                        onClose={() => this.setState({ openDatePicker: false })}
                        onChange={(val) => this.setState({ date: val })}
                        className="MuiOutlinedInput-input bg-white border"
                        placeHolder={"strings.feedback.giveModalDatePH"}
                            minDate={addDay(new Date(), 1)}
                        />
                        }
                {
                    surveyList.length > 0 && surveyList.map((item, index) => {
                        return (
                            <div className={surveyList.length>1?"app-card mb-3": "app-card"} key={index}>
                                <div className="container mt-1 survey-wrap">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div className="d-flex flex-column">
                                            <div className="d-flex pl-4 pb-2 align-items-center">
                                                {(item.surveyStatus !== "EXPIRED" && !item.selfCreatedSurvey && item.surveyStatus !== "COMPLETED") && <>
                                                    <i className="fa fa-star text-warning ml-3" style={{ fontSize: 12 }} aria-hidden="true" />
                                                    <p className="normal font-weight-bold text-warning ml-2" style={{ fontSize: 12 }}>{t('survey.new')}</p></>}

                                                {item.isAnonymous && <>
                                                    <i className="fas fa-user-slash text-gray ml-3" style={{ fontSize: 10 }} aria-hidden="true" />
                                                    <p className="normal font-weight-normal text-gray ml-2" style={{ fontSize: 12 }}>{t('survey.anonymousSurvey')}</p></>}
                                            </div>

                                            <div className="d-flex align-items-center">
                                                {item.surveyStatus == "COMPLETED" ?
                                                    <i className="fas fa-check-circle text-primary fa-lg float-left ml-2" /> :
                                                    <i className="far fa-circle text-gray fa-lg float-left ml-2" />}
                                                <h5 className="text-break ml-3 mt-2">{item.surveyTitle}</h5>
                                            </div>
                                        </div>
                                        {item.selfCreatedSurvey &&
                                        item.surveyStatus !== "COMPLETED" && item.surveyStatus !== "CANCELLED" && item.surveyStatus !== "EXPIRED" &&
                                            <div className="dropdown dropleft">
                                                <span className="float-right"
                                                    role="button" id="dropdownMenuLink"
                                                    data-toggle="dropdown"
                                                    aria-haspopup="true"
                                                    aria-expanded="false">
                                                    <i className="icon-more-horizontal text-black"></i>
                                                </span>

                                                <div className="dropdown-menu"
                                                    aria-labelledby="dropdownMenuLink">
                                                    <span className="dropdown-item pointer small text-black font-weight-bold"
                                                        onClick={() => this.editcancelOrDate(item, 'date')}>{t('survey.editCloseOption')}</span>
                                                        <span className="dropdown-item pointer small text-black font-weight-bold"
                                                            onClick={() => this.editcancelOrDate(item, 'cancel')}>{t('common.cancel')}</span>
                                                </div>
                                            </div>}
                                    </div>
                                    <div className="d-flex align-items-center pt-1 pb-3">
                                        <p className="text-gray ml-2 normal pre-wrap">{item.surveyTemplateDesc}</p>
                                    </div>

                                    <div className="row pt-3 pb-3">
                                        <div className="d-flex col-12 col-lg-4" style={{ wordBreak: 'break-word', overflow: 'hidden' }}>
                                            <div className="mr-2">
                                                <ImageUtils
                                                    src={item.creatorImageUrl}
                                                    name={item.createdBy}
                                                    width={36}
                                                    height={36}
                                                    className="rounded-circle"
                                                />
                                            </div>
                                            <div>
                                                <p className="small font-weight-bold">{item.createdBy}</p>
                                                <p className="x-small text-gray">{t('survey.creator')}</p>
                                            </div>
                                        </div>

                                        <div className="d-flex col-12 col-lg-4 mt-3 mt-lg-0" style={{ wordBreak: 'break-word', overflow: 'hidden' }}>
                                            <div className="mr-2 bg-light-red rounded-circle text-center d-table"
                                                style={{ width: 36, height: 36 }}>
                                                <i className="far fa-clock text-danger d-table-cell align-middle"></i>
                                            </div>
                                            <div>
                                                <p className="small font-weight-bold">{moment(item.dueDate).format('DD MMM YYYY')}</p>
                                                <p className="x-small text-gray">{item.surveyStatus === "COMPLETED" ? t('survey.suveyCompleted') : item.surveyStatus === "EXPIRED" ? t('survey.closed') : item.surveyStatus === "CANCELLED" ? t('survey.surveyCancelled') : t('survey.closingDate')}</p>
                                            </div>
                                        </div>
                                        <div className="col-12 col-lg-4 mt-3 mt-lg-0">
                                            {this.renderButton(item, index)}
                                        </div>
                                    </div>
                                    {!item.selfCreatedSurvey && item.surveyStatus === "COMPLETED" && this.renderEditContainer(item)}
                                </div>
                            </div>
                        )
                    })
                }
            </InfiniteScroll>
        )
    }
    closeModal = () => {
        this.setState({showSurveyModal: false, surveyModalId: ""});
    }
    renderSpeicificSurveyModal() {
        const { showSurveyModal }=this.state;
        if(showSurveyModal) {
            return (
                <div style={{ padding: '0px' }} className="p-0 m-0">
                    <Modal
                        show={showSurveyModal}
                        backdrop={showSurveyModal}
                        onHide={this.closeModal}
                        dialogClassName="survey_modal"
                        centered
                        size="lg"
                        className="p-0 m-0"
                        aria-labelledby="contained-modal-title-vcenter"
                    >
                        <div className={"maincontainer p-0 m-0 border-0"}>
                            <Modal.Body className="p-0">
                             {this.renderSurveyList()}
                            </Modal.Body>
                        </div>
                    </Modal>
                </div>
            )
        }
    }
    render() {
        const { loading, openParticipateSurveyModal, showConfirmationModal, popupType, surveyCanceLoading, renderNotificationModal } = this.state;
        const { t } = this.props;
        return (
            loading ? <Loading Height="0" /> :
                <React.Fragment>
                    <ToastsContainer store={ToastsStore} position={ToastsContainerPosition.TOP_RIGHT} />
                    {this.renderSelect()}
                    {this.renderSurveyList()}
                    {this.renderSpeicificSurveyModal()}
                    {openParticipateSurveyModal && this.renderParticipateSurveyModal()}
                    {renderNotificationModal && <NotificationModal 
                            show={true}
                            handleClose={this.handleNotificationModalClose}
                            header={t('common.notAvailable')}
                            subHeader={t('survey.surveyCancelledNotificationMessage')}
                        />}
                    {showConfirmationModal &&
                        <LogoutModal fromPages={true} noHeader={popupType === 'cancel' ? true : false} message={popupType === 'cancel' ? t('survey.surveyCancel') : t('common.warning')}
                            onHide={() => {popupType === 'cancel' ? this.modalHide() : this.closeModal()}} 
                            confirmClick={() => {popupType === 'cancel' ? this.closeModal(): this.modalHide()}} loader={surveyCanceLoading} 
                            typeCancel={popupType === 'cancel' ? true : false}/>}
                </React.Fragment>

        );
    }
}

export default withTranslation('translation')(withRouter(SurveyList));