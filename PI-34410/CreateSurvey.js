import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import './surveyStyles.scss';
import CreateNewtab from './CreateNewTab';
import SavedTemplates from './SavedTemplates';
import { Api } from '../../api/Api';
import GetAPIHeader from '../../api/ApiCaller';
import ErrorHandling from '../../api/ErrorHandling';
import $ from 'jquery';
import Loading from '../../components/Loading/loading';
import StorageUtils from '../../containers/utils/StorageUtils';
import {
    ToastsContainer,
    ToastsContainerPosition,
    ToastsStore,
} from "react-toasts";
const Storage = new StorageUtils(); class CreateSurvey extends Component {

    constructor(props) {
        super(props);
        this.state = {
            surveyScreen: true,
            addMemScreen: false,
            publishScreen: false,
            categoryList: [],
            templatesList: [],
            searchList: [],
            notFilterdTemplatesList: [],
            templateLoading: 1,
            activeTab: "createNew",
            prePopulateData: '',
            totalPages: 0,
            pageNumber: 1,
            pageSize: 9,
            editLoader: 0,
            hasMore: true,
            searchHasMore: true,
            searchPageNumber: 1,
            searchPageSize: 9,
            searchFlag: false
        }
    }
    componentDidMount() {
        this.templateCategoryGet();
        const { pageNumber, pageSize } = this.state;
        let th = this;
        $(document).ready(function () {
            $('a[data-toggle="tab"]').on("shown.bs.tab", function (e) {
                 if ($(e.target).attr("href") === "#nav-saved") {
                    th.setState({templatesList: [], searchTerm: "", searchFlag: false});
                    th.surveyGetAPI(pageNumber, pageSize);
                    th.setState({ activeTab: "saveTemplate" })
                }
                 if ($(e.target).attr("href") === "#nav-create") {
                    th.setState({activeTab: "createNew"})
                }
            })
        })
    }

    loadFunc = () => {
        const {pageNumber, pageSize, searchPageNumber, searchPageSize, searchTerm, categorySearchTerm, searchFlag, searchList} = this.state;
        if(searchFlag){
            setTimeout(async () => {
                await this.surveyGetBySearch((searchPageNumber), searchPageSize, searchTerm, categorySearchTerm, searchList);
                }, 2000)
        } else{
            setTimeout(async () => {
                
            await this.surveyGetAPI((pageNumber),pageSize);
            }, 2000)
        }
    }
    //API Calls
    surveyGetById(sguid) {
        this.setState({ editLoader: 1 })
        new Api(GetAPIHeader(Storage.getAccessToken())).v31.surveyGetById(sguid)
            .then(response => {
                this.setState({ prePopulateData: response, editLoader: 0 });
            }).catch((err) => {				
                ErrorHandling(err)
                ToastsStore.error(err.Message, 3000);
                this.setState({ editLoader: 0 })
            });
    }
    templateCategoryGet() {
        new Api(GetAPIHeader(Storage.getAccessToken())).v31.templateCategoryGet()
            .then(response => {
                response.length > 0 && response.map((eachCat) => {
                    eachCat.value = eachCat.description;
                    eachCat.label = eachCat.description;
                    eachCat.surveyId = eachCat.sguid;
                })
                this.setState({ categoryList: response });
            }).catch((err) => {				
                ErrorHandling(err)
                ToastsStore.error(err.Message, 3000);
            });
    }

    surveyGetBySearch(pageNumber, pageSize, searchTerm, categorySearchTerm, searchList, searchHasMore){
        const {templatesList} = this.state;
        if(this.state.searchHasMore === true || searchHasMore === true|| categorySearchTerm){
            if(pageNumber === 1){
                this.setState({templateLoading: 1});
            }
            this.setState({searchPageNumber: pageNumber});
            new Api(GetAPIHeader(Storage.getAccessToken())).v31.surveyGetBySearch({
                "sendSurveySearchParam.search": searchTerm,
                "sendSurveySearchParam.surveyCategorysearch": categorySearchTerm,
                "sendSurveySearchParam.status": "",
            "sendSurveySearchParam.sortorder": "DESCENDING",
                "sendSurveySearchParam.page": pageNumber,
                "sendSurveySearchParam.pagesize": pageSize
            })
                .then(response => {
                this.setState({searchList:[...searchList, ...response.Result], totalPages: response.TotalRecords,
                    templateLoading: 0});
                if(response.Result.length < pageSize || response.Total === pageSize || response.Total === templatesList.length){
                    this.setState({searchHasMore: false, searchPageNumber: 1, templatesList: [...searchList, ...response.Result]});
                } else {
                    this.setState({searchHasMore: true, templatesList: [...searchList, ...response.Result]});
                }
                    if (response.Result.length < pageSize || response.Total === pageSize || response.Total === templatesList.length) {
                        this.setState({ searchHasMore: false, searchPageNumber: 1, templatesList: [...searchList, ...response.Result] });
                    } else {
                        this.setState({ searchHasMore: true, templatesList: [...searchList, ...response.Result] });
                    }
                }).catch((err) => {				
                    ErrorHandling(err)
                    this.setState({
                        templateLoading: 0
                    })
                });
        }
    }


    surveyGetAPI(pageNumber, pageSize){
        const {templatesList, notFilterdTemplatesList} = this.state;
        if( true){
            if(pageNumber === 1){
                this.setState({templateLoading: 1, pageNumber: pageNumber});
            }
            new Api(GetAPIHeader(Storage.getAccessToken())).v31.surveyGet({
                "surveyParam.title": "",
                "surveyParam.category": "",
                "surveyParam.createby":"",
                "surveyParam.modifiedby":"",
                "surveyParam.createfrom":"",
                "surveyParam.createto":"",
                "surveyParam.modifiedfrom":"",
                "surveyParam.modifiedto":"",
                "surveyParam.sort": "",
                "modifiedDate":"",
                "surveyParam.sortorder":"DESCENDING",
                "surveyParam.page":pageNumber,
                "surveyParam.pagesize":pageSize
            })
                .then(response => {
                    this.setState({templatesList:[...templatesList, ...response.Result], totalPages: response.TotalRecords,
                                    notFilterdTemplatesList: [...notFilterdTemplatesList, ...response.Result], templateLoading: 0});
                    if(response.Result.length < pageSize || response.TotalRecords === pageSize || response.TotalRecords === templatesList.length){
                        this.setState({hasMore: false, pageNumber: pageNumber+1});
                    } else {
                        this.setState({hasMore: true,pageNumber:pageNumber+1});
                    }
                }).catch((err) => {				
                    ErrorHandling(err)
                    this.setState({ templateLoading: 0 });
                });
        }
    }
    //Child methods
    getProgress = (surveyScreen, addMemScreen, publishScreen) => {
        this.setState({ surveyScreen: surveyScreen, addMemScreen: addMemScreen, publishScreen: publishScreen })
    }
    categoryChange = (categoryVal) => {
        const { notFilterdTemplatesList } = this.state;
        var filterdArr = notFilterdTemplatesList.filter(tempCategory => (tempCategory.templateCategoryName.toLowerCase()).includes(categoryVal.description.toLowerCase()))
        this.setState({ templatesList: filterdArr });
    }
    useSurvey = (tabFromReview, sguid) => {
        this.setState({ activeTab: tabFromReview });
        var id = tabFromReview === "createNew" && "#nav-create-tab"
        $(document).ready(function () {
            $(id).tab('show');
        })
        this.surveyGetById(sguid)
    }
    setSearchterm = (searchterm) => {
        this.setState({searchTerm: searchterm, searchFlag: true, searchHasMore: false, searchList: []});
    }
    setCategoryChange = (categorySearchTerm) => {
        const { searchPageNumber, searchPageSize, searchTerm } = this.state;
        this.setState({
            categorySearchTerm: categorySearchTerm,
            searchFlag: true,
            searchHasMore: false
        }, this.surveyGetBySearch(searchPageNumber, searchPageSize, searchTerm, categorySearchTerm, []));
    }
    render() {
        const { t } = this.props;
        const { surveyScreen, addMemScreen, publishScreen, categoryList, templatesList, templateLoading,
            activeTab, prePopulateData, totalPages, pageNumber, pageSize, editLoader, hasMore,
            searchPageNumber, searchPageSize, searchHasMore, searchFlag } = this.state;
        return (
            <div className="container-fluid">
                <ToastsContainer store={ToastsStore} position={ToastsContainerPosition.TOP_RIGHT} />
                    <nav>
                    <div className="nav nav-tabs app-tabs" id="nav-tab" role="tablist">
                        <a
                            className="nav-item nav-link active"
                            id="nav-create-tab"
                            data-toggle="tab"
                            href="#nav-create"
                            role="tab"
                            aria-controls="nav-create"
                            aria-selected="false"
                        >
                            {t("survey.createNew")}
                        </a>

                        <a
                            className="nav-item nav-link"
                            id="nav-saved-tab"
                            data-toggle="tab"
                            href="#nav-saved"
                            role="tab"
                            aria-controls="nav-saved"
                            aria-selected="false"
                        >
                            {t("survey.savedTemplates")}
                        </a>
                    </div>
                </nav>
                <div
                    className="tab-content mt-4"
                    id="nav-tabContent"
                    style={{ padding: "0" }}
                >
                    <div
                        className="tab-pane fade show active"
                        id="nav-create"
                        role="tabpanel"
                        aria-labelledby="nav-create-tab"
                    >
                        {activeTab === "createNew" &&
                            <>
                                <div className="row">
                                    <div className="col-12 col-sm-6 col-md-6 col-lg-6 font-weight-bold xlarge">{t("survey.newSurvey")}</div>
                                    <div className="col-12 col-sm-6 col-md-6 col-lg-6 mb-2 create-survey-margin px-3 px-lg-0 px-md-0 px-sm-0">
                                        {
                                            <div className="app-card border">
                                                <p className="small text-uppercase mb-2 ml-2">{t("survey.progress")}</p>
                                                <div className="border-bottom"></div>
                                                <div className="d-flex justify-content-between mt-3 ">
                                                    <div className={surveyScreen && "text-blue"}>
                                                        <div className="d-flex justify-content-center mb-1">
                                                            <i class="fa fa-question-circle"></i></div>
                                                        <p className={"x-small text-blue text-center"} >{t("survey.questions")}</p>
                                                    </div>
                                                    <div className={addMemScreen ? "active-outer-line mb-4" : "outer-line mb-4"}></div>
                                                    <div className={addMemScreen && "text-blue"}>
                                                        <div className="d-flex justify-content-center mb-1">
                                                            <i class="fas fa-user-tie"></i></div>
                                                        <p className={'text-center x-small ' + ( addMemScreen ? "text-blue" : "text-gray")}>{t("survey.selectRespondents")}</p>
                                                    </div>
                                                    <div className={publishScreen ? "active-outer-line mb-4" : "outer-line mb-4"}></div>
                                                    <div className={publishScreen && "text-blue"}>
                                                        <div className="d-flex justify-content-center mb-1"> 
                                                            <i class="fas fa-vote-yea"></i>
                                                        </div>
                                                        <p className={'text-center x-small ' + (publishScreen ? "text-blue" : "text-gray")}>{t("survey.saveAndPublish")}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        }
                                    </div>
                                </div>
                                {editLoader ? <Loading /> :
                                    <CreateNewtab getProgress={this.getProgress}
                                        categoryList={categoryList}
                                        prePopulateData={prePopulateData} />}
                            </>
                        }
                    </div>
                    <div
                        className="tab-pane fade"
                        id="nav-saved"
                        role="tabpanel"
                        aria-labelledby="nav-saved-tab"
                    >
                        {activeTab === "saveTemplate" &&
                            <SavedTemplates categoryList={categoryList}
                                templatesList={templatesList}
                                templateLoading={templateLoading}
                                useSurvey={this.useSurvey.bind(this)}
                                categoryChange={this.categoryChange.bind(this)}
                                surveyGetAPI={this.surveyGetAPI.bind(this)}
                                totalPages={totalPages}
                                pageNumber={pageNumber}
                                pageSize={pageSize}
                                searchPageNumber={searchPageNumber}
                                searchPageSize={searchPageSize}
                                searchHasMore={searchHasMore}
                                searchFlag={searchFlag}
                                setSearchterm={this.setSearchterm}
                                searchTerm={this.state.searchTerm}
                                categorySearchTerm={this.state.categorySearchTerm}
                                setCategoryChange={this.setCategoryChange}
                                surveyGetBySearch={this.surveyGetBySearch.bind(this)}
                                loadFunc={this.loadFunc}
                                hasMore={hasMore} />}

                    </div>
                </div>
            </div>
        );
    }
}

export default withTranslation('translation')(CreateSurvey);