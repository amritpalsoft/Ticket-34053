import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import { withRouter } from "react-router-dom";
import './surveyStyles.scss';
import StarRatings from 'react-star-ratings';
import { PieChart, Pie, Cell, Legend } from 'recharts';
import { Api } from '../../api/Api';
import GetAPIHeader from '../../api/ApiCaller';
import ErrorHandling from '../../api/ErrorHandling';
import Loading from '../../components/Loading/loading';
import EmptyImage from '../../assets/images/No data-cuate.svg';
import StorageUtils from '../../containers/utils/StorageUtils';
import MatrixPreviewTable from './MatrixPreviewTable';

const Storage = new StorageUtils();
const COLORS = ['#B3D0FF', '#66A1FF'];  

var ExcelReport = require('../../components/ExcelReport/ExcelReport');

const renderCustomizedLabel = ({
    x, y, value, membersCount, label
}) => {
    return (

        <text x={x} y={y} fill="black" textAnchor={label === "Req" ? (value === 0 ? "start" : (value >= 1 || value < 100) ? "end" : "middle") : (value === 100 ? "end" : "start")} dominantBaseline={label == "Req" ? "start" : "central"}
            style={{ fontSize: '10px' }}>
            {value + "% " + "(" + membersCount + ")"}
        </text>
    );
};


class SurveyResults extends Component {

    constructor(props) {
        super(props);
        this.state = {
            surveyDetails: '',
            loading: 1
        }
    }
    componentDidMount(){
        const {location} = this.props
        if(location && location.state && location.state.surveyObj){
            this.setState({loading: 1});
            new Api(GetAPIHeader(Storage.getAccessToken())).v31.getSurveyGraphReport(location.state.surveyObj.sguid)
                .then(response => {
                this.setState({surveyDetails: response, loading: 0})
            }).catch((err) => {				ErrorHandling(err)
                this.setState({loading: 0});
                });
        }
    }

    getFilterStyle(opt) {
        return {
            height: '100%',
            width: `${opt.totalResposeAvgCount}%`,
            backgroundColor: "#B3D0FF",
            borderRadius: 4
        }
    }
    getFilterStyleActive(opt) {
        return {
            height: '100%',
            width: `${opt.totalResposeAvgCount}%`,
            backgroundColor: '#66A1FF',
            borderRadius: 4
        }
    }
    renderMatrix(eachQuestion){
        let matrix = eachQuestion && eachQuestion.matrix;
        let rowLabel = matrix && matrix.rows
        let columnLabel = matrix && matrix.columns;
        let Matrixcalc = matrix && matrix.Matrixcalc;
        if(rowLabel && rowLabel.length > 0){
            rowLabel.map((eachrow)=>{
                Matrixcalc && Matrixcalc.length > 0 &&
                Matrixcalc.map((eachMat)=>{
                    if(eachrow.title === eachMat.RowTitle){
                        eachrow.selectedCol = eachMat.ColTitle;
                        eachrow.totalResposeAvgCount = eachMat.totalResposeAvgCount
                    }
                })
            })
        }
        return (
        <>
        <p className="xlarge font-weight-bold mb-2 break-word">{eachQuestion.questionText}</p>
        <MatrixPreviewTable rowLabel={rowLabel} columnLabel={columnLabel} viewAnswers={true} Matrixcalc={Matrixcalc}/>
        </>)
    }
    exportSurvey = (surveyId) => {
        this.setState({ loading: 1 });
        new Api(GetAPIHeader(Storage.getAccessToken())).v31.surveyResultGetXls(surveyId)
            .then(response => {
                ExcelReport.exportToExcelReport("Individual", response);
                this.setState({ loading: 0 })
            }).catch((err) => {
                this.setState({ loading: 0 });
            });

    }
    exportSimpleQuestion = (surveyId, questionId) => {
        this.setState({ loading: 1 });
        new Api(GetAPIHeader(Storage.getAccessToken())).v31.surveySimpleQuestionResultGetXls(surveyId, { questionId: questionId })
            .then(response => {
                ExcelReport.exportToExcelReport("Individual", response);
                this.setState({ loading: 0 })
            }).catch((err) => {
                this.setState({ loading: 0 });
            });

    }
    renderQuestions() {
        const { t } = this.props;
        const { surveyDetails } = this.state;
        var RequestedParticipants = surveyDetails !== "" && surveyDetails !== undefined && surveyDetails.SurveyResponse.RequestedParticipants;
        var RespondedParticipants = surveyDetails !== "" && surveyDetails !== undefined && surveyDetails.SurveyResponse.RespondedParticipants;
        var TotalRequestedParticipants = surveyDetails !== "" && surveyDetails !== undefined && surveyDetails.SurveyResponse.TotalRequestedParticipants;
        var TotalRespondedParticipants = surveyDetails !== "" && surveyDetails !== undefined && surveyDetails.SurveyResponse.TotalRespondedParticipants;
        const data = [
            {
                name: t('survey.surveyReqParticipants'),
                value: RequestedParticipants,
                membersCount: TotalRequestedParticipants,
                color: '#B3D0FF',
                label: 'Req'
            },
            {
                name: t('survey.surveyRespParticipants'),
                value: RespondedParticipants,
                membersCount: TotalRespondedParticipants,
                color: '#66A1FF',
                label: 'Resp'
            },
        ];
        return (
            <div>
                {surveyDetails !== "" && surveyDetails !== undefined && (RespondedParticipants || TotalRespondedParticipants )> 0 ?
                    <div className="row mt-3 pl-2">
                        <div className={"col-xl-8 col-lg-12 col-md-12 col-sm-12 col-12"}>
                            {surveyDetails.sections[0].questions.length > 0 &&
                                surveyDetails.sections[0].questions.map((eachQuestion, index) => {
                                    return (
                                        <div className="border rounded p-3 mt-2 mb-3">
                                            <p className="small mb-1 break-word font-weight-bold" style={{ color: '#666' }}>{'Question ' + (index + 1)}</p>
                                            {eachQuestion.questionType === "questionsimple" &&
                                                <div className="d-flex justify-content-between">
                                                    <p className="large font-weight-bold mb-2 break-word">{eachQuestion.questionText}</p>
                                                    <div className="pointer"
                                                        style={{ zIndex: '99' }}
                                                        onClick={() => this.exportSimpleQuestion(surveyDetails.sguid, eachQuestion.sguid)}>
                                                        <i class="far fa-download"></i>
                                                    </div>
                                                </div>}
                                            {eachQuestion.questionType === "questionmultichoice" &&
                                                this.renderHorizontalBarChart(eachQuestion)
                                            }
                                            {eachQuestion.questionType === "questionrating" &&
                                                this.renderRating(eachQuestion)
                                            }
                                            {eachQuestion.questionType === "questionmatrix" &&
                                                this.renderMatrix(eachQuestion)
                                            }
                                        </div>
                                    )

                                })
                            }
                        </div>
                        <div className="col-xl-4 col-lg-6 col-md-8 col-sm-8 col-12">
                            <div className="border rounded p-3 my-2">
                                <p className="normal text-center mb-n5 font-weight-bold">{t('survey.totalSurveyResponses')}</p>
                                <div className="d-flex justify-content-center mt-4">
                                    <PieChart width={300} height={250}>
                                        <Pie
                                            dataKey="value"
                                            isAnimationActive={false}
                                            data={data}
                                            cx="50%"
                                            cy="50%"

                                            outerRadius={50}
                                            fill="#8884d8"
                                            label={renderCustomizedLabel}
                                        >
                                            {data.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}
                                                />
                                            ))}

                                        </Pie>
                                        <Legend
                                            layout="vertical" verticalAlign="bottom" align="center"
                                            payload={
                                                data.map(
                                                    (item, index) => ({
                                                        id: item.name,
                                                        type: "square",
                                                        value: `${item.name}`,
                                                        color: `${item.color}`
                                                    })
                                                )
                                            }
                                        />
                                    </PieChart>
                                </div>
                            </div>
                            <div className="d-flex justify-content-center mt-4">
                                    <button
                                        onClick={() => this.exportSurvey(surveyDetails.sguid)}
                                        className={"py-2 btn-primary btn-border-radius normal border-0 px-3"}>
                                        <span className={"text-white"}>
                                            {t('survey.exportResult')}</span>
                                    </button>
                                </div>
                        </div>
                    </div> :
                    <div className="d-flex justify-content-center mt-5">
                        <div>

                            <img alt="" src={EmptyImage} style={{ height: '260px' }} />
                            <p className="text-center mt-4 font-weight-bold normal">{t('survey.noAnswers')}</p></div>
                    </div>}
            </div>
        )
    }
    renderHorizontalBarChart(eachQuestion) {
        var finalRating = 0;
        var heighestChoiceIdx;
        eachQuestion.multipleChoice.values.map((eachChoice, index) => {
            if (finalRating <= eachChoice.totalResposeAvgCount) {
                finalRating = eachChoice.totalResposeAvgCount;
                heighestChoiceIdx = index;
            }
        })
        return (
            <div>
                <p className="xlarge font-weight-bold mb-2 break-word">{eachQuestion.questionText}</p>
                {eachQuestion.multipleChoice.values.map((eachChoice, index) => {
                    if (finalRating <= eachChoice.totalResposeAvgCount) {
                        finalRating = eachChoice.totalResposeAvgCount;
                        heighestChoiceIdx = index;
                    }
                    return (
                        <div className="row d-flex">
                            <div className="col-3 mb-3">
                                <div className="small text-gray break-word">{eachChoice.value}</div></div>
                            <div className="col-1 border-right"></div>
                            <div className="col-7 px-0 mb-3 mr-n1">
                                <div className={"ml-2 survey-horizontal-container"}>
                                    <div style={heighestChoiceIdx == index ? this.getFilterStyleActive(eachChoice) : this.getFilterStyle(eachChoice)}></div>
                                </div></div>
                            <div className="col-1 mb-3">
                                <div className="small"
                                    style={{ color: heighestChoiceIdx === index ? "#0062FF" : '#666' }}>{eachChoice.totalResposeAvgCount + '%'}</div></div>
                        </div>
                    )
                })}
            </div>
        )
    }
    renderVericalBarChart(eachQuestion) {
        var ratingType = eachQuestion.Ratings && eachQuestion.Ratings[0].RatingType;
        var obj1;
        var heighest = 0;
        var finalHeighest = 0
        if (ratingType === 2) {
            obj1 = { poor: 0, okay: 0, good: 0 }
        } else {
            obj1 = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 }
        }
        const obj2 = eachQuestion.Ratings && eachQuestion.Ratings[0].RatingValuePair;
        Object.keys(obj1).map((key) => {
            Object.keys(obj2).map((key1) => {
                if (heighest <= obj2[key1]) {
                    heighest = obj2[key1];
                    finalHeighest = key1;
                }
                if (key === key1) {
                    obj1[key] = obj2[key1]
                }
            })
        })
        return (
            <div>
                <div className="d-flex mb-2">
                    {ratingType === 2 &&
                        <>
                            {finalHeighest === "poor" ?
                                <div className="d-flex justify-content-center icon-large ">
                                    <i class="fal fa-frown mr-2"></i> </div> :
                                finalHeighest === "okay" ?
                                    <div className="d-flex justify-content-center icon-large ">
                                        <i class="fal fa-meh mr-2"></i></div> :
                                    <div className="d-flex justify-content-center icon-large ">
                                        <i class="fal fa-smile mr-2"></i></div>}
                            <p className="large mr-1 text-blue font-weight-bold text-capitalize">{finalHeighest}</p>
                        </>}
                </div>
                <div className="d-flex justify-content-center">
                    {Object.keys(obj1).map((ratingKey, index) => {
                        if (ratingType === 2) {
                            if (heighest <= obj1[ratingKey]) {
                                heighest = obj1[ratingKey];
                                finalHeighest = ratingKey;
                            }
                        } else {
                            if (heighest <= obj1[index]) {
                                heighest = obj1[index];
                                finalHeighest = index;
                            }
                        }
                        var multiplyHeight = obj1[ratingKey] * 2
                        return (
                            <div className="mr-n1">
                                <p className={ratingType === 2 ?
                                    "text-responsive text-gray text-center" :
                                    "text-responsive text-gray text-left mr-1"}>{obj1[ratingKey] + '%'}</p>
                                <div>
                                    <div className={ratingType === 2 ?
                                        "mx-4 survey-verical-large-barchat my-2 rounded-lg" :
                                        "mr-xl-4 mr-lg-3 mr-md-3 mr-sm-3 mr-0 survey-verical-large-barchat my-2 rounded-lg"}
                                        style={{
                                            height:
                                                ratingType === 2 ? 100 : 200
                                        }}>
                                        <div className={ratingKey == finalHeighest ? "activeMyBar rounded-lg" : 'myBar rounded-lg'}
                                            style={{
                                                height: ratingType === 2 ?
                                                    obj1[ratingKey] : multiplyHeight
                                            }}></div>
                                    </div>
                                </div>
                                <div className="border border-bottom"></div>
                                {ratingType === 2 ?
                                    ratingKey === "poor" ?
                                        <div className="d-flex justify-content-center mt-2 icon-large ">
                                            <i class="fal fa-frown ml-1"></i> </div> :
                                        ratingKey === "okay" ?
                                            <div className="d-flex justify-content-center mt-2 icon-large ">
                                                <i class="fal fa-meh ml-1"></i></div> :
                                            <div className="d-flex justify-content-center mt-2 icon-large ">
                                                <i class="fal fa-smile ml-1"></i></div>
                                    :
                                    <p className="normal text-gray ml-xl-2 ml-lg-2 ml-md-2 ml-sm-2 ml-0">{index}</p>}
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }
    renderRating(eachQuestion) {
        const { t } = this.props;
        return (
            <div>
                <p className="xlarge font-weight-bold mb-2 break-word">{eachQuestion.questionText}</p>
                {eachQuestion.Ratings && eachQuestion.Ratings[0].RatingType === 1 &&
                    <>
                        <div className="d-flex mb-2">
                            <p className="large mr-1 text-blue font-weight-bold">{eachQuestion.Ratings[0].AverageRating}</p>
                            <p className="x-small d-flex align-items-center">{t('survey.avg')}</p>
                        </div>
                        <StarRatings
                            rating={eachQuestion.Ratings[0].AverageRating}
                            starRatedColor="#66A1FF"
                            numberOfStars={5}
                            starDimension="28px"
                            name="rating"
                            starSpacing="2px"
                            starHoverColor="#66A1FF"
                            starEmptyColor='#f2f2f2'
                        />
                    </>
                }
                {eachQuestion.Ratings && eachQuestion.Ratings[0].RatingType === 2 &&
                    this.renderVericalBarChart(eachQuestion)
                }
                {eachQuestion.Ratings && eachQuestion.Ratings[0].RatingType === 3 &&
                    this.renderVericalBarChart(eachQuestion)
                }
            </div>
        )
    }

    render() {
        const {loading, surveyDetails}=this.state;
        const {t} = this.props;
        var rowLabel = [{label : "row-1", type: 'string'},{label : "row-1", type: 'string'}]
        var columnLabel = [{"title": "col-1", "checked": false},{"title": "col-2", "checked": false}]
        return (
            <React.Fragment>
               
                <div className="container">
                    <div className="bg-white p-3 rounded">
                        <div className="d-flex align-items-center justify-content-between">
                            <h5 className="mb-4 ml-2">{t('survey.surveyResponses')}</h5>
                            <i className="fal fa-times fa-md text-gray pointer mt-n4 p-2 close_ic"
                                onClick={() => this.props.history.goBack()}></i>
                        </div>
                        <div className="border-bottom"></div>
                        {loading ? <Loading /> :
                            <>
                                <p class="text-gray pl-2 mt-3">{surveyDetails !== "" && surveyDetails.templateCategoryName}</p>
                                <h4 class="font-weight-bold text-black pl-2 pt-1">{surveyDetails !== "" && surveyDetails.surveyTitle}</h4>
                                <div className="d-flex justify-content-between">
                                    <p class="small text-gray pl-2 pre-wrap">{surveyDetails !== "" && surveyDetails.surveyTemplateDesc}</p>
                                </div>
                                {this.renderQuestions()}
                            </>
                        }
                    </div>
                </div>
            </React.Fragment>
        );
    }
}

export default withTranslation('translation')(withRouter(SurveyResults));