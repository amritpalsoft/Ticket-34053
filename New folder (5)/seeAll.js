import React from 'react';
import { Button, Card, Col, Row, } from 'react-bootstrap';

import './redemptionsStyle.scss';
import { withRouter } from 'react-router-dom';
import 'bootstrap/dist/js/bootstrap.bundle';
import { Api } from '../../../api/Api';
import GetAPIHeader from '../../../api/ApiCaller';
import '../../../assets/icons/navIconFonts/style.css';
import BackButtonIcon from '../../../assets/icons/navIcons/ic_refund.png';
import $ from 'jquery';
import { ToastsContainer, ToastsContainerPosition, ToastsStore } from 'react-toasts';
import Pagination from "react-js-pagination";
import { PointsFormat } from '../../../components/numberFormatter/NumberFormatter';
import emptyRewards from '../../../assets/images/empty/rewards.svg';
import Loading from '../../../components/Loading/loading';
import Empty from "../../../components/Utils/Empty/Empty";
import RedemptionModal from './RedemptionModal';
import { withTranslation } from 'react-i18next';
import StorageUtils from '../../../containers/utils/StorageUtils';

const Storage = new StorageUtils();

class SeeAll extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            currentItem: [],
            products: [],
            updating: 0,
            productTitle: '',
            pageNumber: 1,
            pageSize: 20,
            totalPages: 0,
            searchText: '',
            loading: 1,
            openRedemptionModal: 0,
            language: 'en'
        }
        this.keyPress = this.keyPress.bind(this);
    }

    componentDidMount() {
        const {t}=this.props;
        if (this.props.location.state.titleValue === 'Just For You') {
            this.setState({ productTitle: t('redemption.justForYou') });
            this.getJustForYou(this.state.pageNumber);
        } else if (this.props.location.state.titleValue === 'Top Rewards') {
            this.setState({ productTitle: t('redemption.topRewards') });
            this.getTopRewards(this.state.pageNumber);
        } else if (this.props.location.state.titleValue === 'Categories') {
            let topCategoriesItems = this.props.location.state.itemValue;
            if (topCategoriesItems !== null && topCategoriesItems !== '' && topCategoriesItems !== undefined) {
                this.setState({ productTitle: topCategoriesItems.Name });
            } else {
                this.setState({ productTitle: t('redemption.categories') });
            }
            this.getTopCategoriesItems(topCategoriesItems, this.state.pageNumber);
        }
    }
    render() {
        const {t}=this.props;
        return (
            <div>
                <div className="container">
                    {
                        <div>
                            <ToastsContainer store={ToastsStore} position={ToastsContainerPosition.TOP_RIGHT}
                                lightBackground />
                            <div className="text-left pointer text_grey"
                                onClick={() => {
                                    this.gotoBackPage()
                                }}>
                                <img className="backIcon" src={BackButtonIcon} />
                                <span className="font-weight-bold text-gray">    {' '}{t('redemption.back')}    </span>
                            </div>
                            <br />

                            <div className="row">
                                <div className="col-sm-8">
                                    <div className="d-flex">
                                        <input value={this.state.searchText} type="text"
                                            className="form-control border-0 p-3"
                                            name="search" placeholder="Search" onKeyDown={this.keyPress}
                                            onChange={(e) => this.setSearchValue(e.target.value)} />
                                        <Button className=" btn" onClick={() => {
                                            this.searchProduct()
                                        }}> {t('common.search')} </Button>
                                    </div>
                                </div>

                                <div className="col-sm-4 text-right ">
                                    {/*<span className="app-blue-badge-pill small text_grey"*/}
                                    {/*        onClick={() => {*/}
                                    {/*            this.removeFilterValue()*/}
                                    {/*        }}>*/}
                                    {/*    Remove Filter X*/}
                                    {/*</span>*/}
                                </div>
                            </div>

                            <br />
                            <p className="text_grey font-weight-bold">{this.state.productTitle}</p>
                            <br />

                            <div className="row">
                                {this.state.loading ? <Loading Height="0" /> :
                                    this.state.products.length === 0 ?
                                        <Empty image={emptyRewards} text={t('redemption.emptyRewards')} />
                                        :
                                        (this.state.products.map((item, index) => {
                                            return (
                                                <div
                                                    className="col-6 col-sm-4 col-md-3 pointer mb-4"
                                                    key={index} onClick={() => {
                                                        this.enableModal(item)
                                                    }}>

                                                    <div style={{
                                                        background: "url(" + item.ImageUrl + ") center no-repeat",
                                                        backgroundSize: 'cover',
                                                        height: 150
                                                    }} className="img-fluid rounded-lg p-2">
                                                        {(item.RequireApproval === true) ?
                                                            <span
                                                                className="float-right small rounded p-1 pr-2 pl-2 bg-white font-weight-bold  text_red">{'Approval Required'}</span> :
                                                            <span
                                                                className="float-right small rounded p-1 pr-2 pl-2 bg-white font-weight-bold text-primary">{'Instant Approval'}</span>
                                                        }
                                                    </div>


                                                    <p className="font-weight-bold mt-2 text-ellipsis-2" data-toggle="tooltip" data-placement="top" title={item.Name}>{item.Name}</p>
                                                    <span
                                                        className="small text-primary font-weight-bold"> {PointsFormat(item.EligiblePoints)}
                                                        {"  "}{(item.PointsType).toUpperCase()}</span>

                                                </div>
                                            )
                                        }))
                                }
                            </div>
                            {
                                this.state.openRedemptionModal === 1 &&
                                <RedemptionModal seeAll={1} item={this.state.currentItem} whislisttabflag={0} closeModal={this.disableRedemptionModal.bind(this)} />
                            }
                        </div>
                    }
                    {
                        <div>
                            <Pagination className="pagination modal-1"
                                activePage={this.state.pageNumber}
                                itemsCountPerPage={this.state.pageSize}
                                totalItemsCount={this.state.totalPages}
                                pageRangeDisplayed={5}
                                onChange={this.handlePageChange.bind(this)}
                            />
                        </div>
                    }
                </div>

            </div>

        )
    }

    getJustForYou(pageNumber) {
        this.setState({
            loading: 1
        });
        new Api(GetAPIHeader(Storage.getAccessToken())).v31.getPopularRedemptionsItemsFo({
            "Status": "1",
            "CreatedDateFrom": "",
            "CreatedDateTo": "",
            "UpdatedDateFrom": "",
            "UpdatedDateTo": "",
            "ExcludeOffers": false,
            "RedemptionName": this.state.searchText,
            "SortBy": {
                "TimesRedeemed": "Descending"
            },
            "RangeField": "EligiblePoints",
            "MinRange": 0,
            "MaxRange": localStorage.getItem('EligiblePoints'),
            "IsRangeApplied": true
        }, { pageNumber: pageNumber, pageSize: this.state.pageSize, isRandom: false })
            .then(response => {
                this.setState({
                    products: response.Result,
                    totalPages: response.Total,
                    loading: 0
                });
            }).catch((errorResponse) => {
                console.log("response popular items ----Error ---->: " + JSON.stringify(errorResponse));
            });
    }

    getTopRewards(pageNumber) {
        this.setState({
            loading: 1
        });
        new Api(GetAPIHeader(Storage.getAccessToken())).v31.getPopularRedemptionsItemsFo({
            "Status": "1",
            "CreatedDateFrom": "",
            "CreatedDateTo": "",
            "UpdatedDateFrom": "",
            "UpdatedDateTo": "",
            "ExcludeOffers": false,
            "RedemptionName": this.state.searchText,
            "SortBy": {
                "TimesRedeemed": "Descending"
            },
            "RangeField": "",
            "MinRange": -1,
            "MaxRange": -1,
            "IsRangeApplied": true
        }, { pageNumber: pageNumber, pageSize: this.state.pageSize, isRandom: false })
            .then(response => {
                this.setState({
                    products: response.Result,
                    totalPages: response.Total,
                    loading: 0
                });
            }).catch((errorResponse) => {
                console.log("response popular items ----Error ---->: " + JSON.stringify(errorResponse));
            });
    }

    getTopCategoriesItems(topCategoriesItem, pageNumber) {
        this.setState({
            loading: 1
        });
        let categoryId = topCategoriesItem.Id;
        let requestJSON;
        if (categoryId != null && categoryId !== '' && categoryId !== undefined) {
            requestJSON = {
                "Status": "1",
                "CategoryIds": [categoryId],
                "CreatedDateFrom": "",
                "CreatedDateTo": "",
                "UpdatedDateFrom": "",
                "UpdatedDateTo": "",
                "ExcludeOffers": false,
                "RedemptionName": this.state.searchText,
                "SortBy":
                {
                    "RedemptionName": "Ascending"
                },
                "RangeField": "EligiblePoints",
                "MinRange": 1,
                "MaxRange": 101,
                "IsRangeApplied": false
            }
        } else {
            requestJSON = {
                "Status": "1",
                "CreatedDateFrom": "",
                "CreatedDateTo": "",
                "UpdatedDateFrom": "",
                "UpdatedDateTo": "",
                "ExcludeOffers": false,
                "RedemptionName": this.state.searchText,
                "SortBy":
                {
                    "RedemptionName": "Ascending"
                },
                "RangeField": "EligiblePoints",
                "MinRange": 1,
                "MaxRange": 101,
                "IsRangeApplied": false
            }
        }
        new Api(GetAPIHeader(Storage.getAccessToken())).v31.getRedemptionsItemsFo(requestJSON, {
            pageNumber: pageNumber,
            pageSize: this.state.pageSize
        }).then((response) => {
            this.setState({
                products: response.Result,
                totalPages: response.Total,
                loading: 0
            })
        }).catch((errorResponse) => {
            console.log("getTopCategories catch errors ---->: " + JSON.stringify(errorResponse));
        })
    }

    setSearchValue(searchText) {
        this.setState({
            searchText: searchText
        });
    }

    createMarkup(value) {
        return {
            __html: value
        };
    };

    keyPress(e) {
        if (e.keyCode == 13) {
            this.searchProduct();
        }
    }

    handlePageChange(selectedPage) {
        this.setState({ pageNumber: selectedPage });
        if (this.props.location.state.titleValue === 'Just For You') {
            this.getJustForYou(selectedPage);
        } else if (this.props.location.state.titleValue === 'Top Rewards') {
            this.getTopRewards(selectedPage);
        } else if (this.props.location.state.titleValue === 'Categories') {
            let topCategoriesItems = this.props.location.state.itemValue;
            this.getTopCategoriesItems(topCategoriesItems, selectedPage);
        }
    }

    gotoBackPage() {
        this.props.history.push('redemption');
    }

    searchProduct() {
        if (this.props.location.state.titleValue === 'Just For You') {
            this.getJustForYou(this.state.pageNumber);
        } else if (this.props.location.state.titleValue === 'Top Rewards') {
            this.getTopRewards(this.state.pageNumber);
        } else if (this.props.location.state.titleValue === 'Categories') {
            let topCategoriesItems = this.props.location.state.itemValue;
            this.getTopCategoriesItems(topCategoriesItems, this.state.pageNumber);
        }
    }

    removeFilterValue() {
        this.state.searchText = '';
        if (this.props.location.state.titleValue === 'Just For You') {
            this.getJustForYou(this.state.pageNumber);
        } else if (this.props.location.state.titleValue === 'Top Rewards') {
            this.getTopRewards(this.state.pageNumber);
        } else if (this.props.location.state.titleValue === 'Categories') {
            let topCategoriesItems = this.props.location.state.itemValue;
            this.getTopCategoriesItems(topCategoriesItems, this.state.pageNumber);
        }
    }

    enableModal(item) {
        this.setState({
            currentItem: item,
            openRedemptionModal: 1,
        });
    }

    disableRedemptionModal() {
        this.setState({
            openRedemptionModal: 0
        });
    }
}

export default withTranslation('translation')(withRouter(SeeAll));
