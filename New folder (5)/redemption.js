import React from 'react';
import {withRouter} from 'react-router-dom';
import './redemptionsStyle.scss';
import bannerImg from '../../../assets/images/reward_banner_img.png';
import emptyRewards from '../../../assets/images/empty/rewards.svg';
import HeaderBanner from '../../../components/Banner/headerBanner';
import Categories from './TopCategories';
import Products from './TopProducts';
import History from './history';
import Wishlist from './wishlist';
import $ from "jquery";
import Empty from "../../../components/Utils/Empty/Empty";
import { withTranslation } from 'react-i18next';
import SlimLoader from '../../../components/SlimLoader/slimLoader';
import ErrorHandling from "../../../api/ErrorHandling";
import { Api } from '../../../api/Api';
import GetAPIHeader from '../../../api/ApiCaller';
import { PointsFormat } from '../../../components/numberFormatter/NumberFormatter';
import StorageUtils from '../../../containers/utils/StorageUtils';

const Storage = new StorageUtils();
class Redemption extends React.Component {
    _isMounted=false;
    constructor(props) {
        super(props)

        this.displaySeeAll = this.displaySeeAll.bind(this);

        this.state = {
            bannerClosed: 0,
            JustForYou: [],
            TopRewards: [],
            showModal: false,
            seeAllFlag: false,
            history: [],
            historyCount: '',
            featuredCount: '',
            wishListCount: '',
            loadingHistory: 1,
            loadingWishList: 1,
            historyPageNumber: 1,
            language: 'en',
            ElgiblePointsBalance: 0            
        }
        this.historyChild = React.createRef();
        this.wishlistChild = React.createRef();
        this.JustForYouRef = React.createRef();
        this.TopRewardsRef = React.createRef();
        this.topCategories = React.createRef();
    }

    // TODO - there's too many api calls loopholes here, please fix the logic
    componentDidMount() {
        // tab redirection from url
        this._isMounted=true;
        if (this.props.match.params.tab) {
            $('#nav-' + this.props.match.params.tab + '-tab').tab('show')
        }
        this.getMySpending();
        this.JustForYouRef.current.getJustForYouItems();
        this.topCategories.current.getTopCategories();                     
        this.TopRewardsRef.current.getTopRewards();

        // this.productRefrence.current.getJustForYouItems();
        // this.productRefrence.current.getTopRewards();
        this.setTabChanging();
    }

    getMySpending() {
        new Api(GetAPIHeader(Storage.getAccessToken())).v31.getUserPoints()
            .then(results => {
                this.setState({                    
                    ElgiblePointsBalance: results.ElgiblePointsBalance                    
                });
                localStorage.setItem('AccumulativeEligiblePoints', results.AccumulatedEligiblePoints)
                localStorage.setItem('EligiblePoints', results.ElgiblePointsBalance)
            }).catch((err) => {				
                ErrorHandling(err)
            });
    }

    setTabChanging(){
        let th=this;
        $(document).ready(function () {
            $('a[data-toggle="tab"]').on("shown.bs.tab", function (e) { 

                if($(e.target).attr("href") == "#nav-featured"){                      
                    $('.nav-tabs a[href="#nav-featured"]').tab('show'); 
                    th.JustForYouRef.current.getJustForYouItems();
                    th.topCategories.current.getTopCategories();                     
                    th.TopRewardsRef.current.getTopRewards();
                }  
                
                if($(e.target).attr("href") == "#nav-history"){                      
                    $('.nav-tabs a[href="#nav-history"]').tab('show');                         
                    th.historyChild.current.getRedemptionHistory(1);   
                } 

                if($(e.target).attr("href") == "#nav-wishlist"){                      
                    $('.nav-tabs a[href="#nav-wishlist"]').tab('show');                         
                    th.wishlistChild.current.getWishList();              
                } 
                
            });
        });             
    }

    updateHistoryData(){
        this.historyChild.current.getRedemptionHistory(1);
    }

    updateWishlistData(){
        this.wishlistChild.current.getWishList();
    }

    navigateTo(title, item) {
        this.props.history.push({
                pathname: 'SeeAll',
                state: {
                    titleValue: title,
                    itemValue: item
                }
            }
        )
    }

    render() {
        const {t} = this.props;
        const {JustForYou, TopRewards} = this.state;
        const userAchivements = JSON.parse(localStorage.getItem('userAchivements'));
        return (
            <div>
                <SlimLoader isAnimating={!this._isMounted} /> 
                <div className="container">
                    <h3 className="page-header">{t("redemption.redemption")}</h3>

                    <nav>
                        <div className="nav nav-tabs app-tabs" id="nav-tab" role="tablist">
                            <a className="nav-item nav-link active" id="nav-featured-tab"
                               data-toggle="tab" href="#nav-featured" role="tab" aria-controls="nav-featured"
                               aria-selected="false">{t("redemption.featured")}
                               {/* <span>{this.state.featuredCount}</span> */}
                               </a>

                            <a className="nav-item nav-link" id="nav-history-tab"
                               data-toggle="tab" href="#nav-history" role="tab" aria-controls="nav-history"
                               aria-selected="false">{t("redemption.history")}
                               {/* <span>{this.state.historyCount}</span> */}
                               </a>

                            <a className="nav-item nav-link" id="nav-wishlist-tab"
                               data-toggle="tab" href="#nav-wishlist" role="tab" aria-controls="nav-wishlist"
                               aria-selected="false">{t("redemption.wishlist")}
                               {/* <span>{this.state.wishListCount}</span> */}
                               </a>
                        </div>
                    </nav>

                    <HeaderBanner bannerImg={bannerImg} bannerHeader={(t("redemption.bannerHeader")) +'!'}
                                  bannerDesc={t("redemption.bannerDesc")}
                                  bannerH4Color={'#0062ff'}
                                  bannerBackground={'#e8f1ff'}/>
                    <br/>
                    <div className="d-flex align-items-center pointBalance">                        
                        <p className="pointBalanceText" style={{paddingLeft: '35px', paddingRight: '35px'}}>{t('myPoints.pointBalance')}{'    '}
                            <span className="pointBalanceText text-blue">
                                &nbsp;&nbsp;&nbsp;&nbsp;{PointsFormat(this.state.ElgiblePointsBalance) + ' ' + userAchivements.PointsType.toUpperCase()}
                            </span> 
                        </p>                               
                    </div>
                    <br />


                    <div className="tab-content" id="nav-tabContent">
                        <div className="tab-pane fade show active" id="nav-featured" role="tabpanel"
                             aria-labelledby="nav-featured-tab">

                            <div className="clearfix mb-3">
                                <p className="text_grey font-weight-bold float-left">{t("redemption.categories")}</p>

                                <p className="small text_grey font-weight-bold float-right" onClick={() => {
                                    this.displaySeeAll('Categories', '');
                                }} style={{cursor: "pointer"}}>{t("redemption.seeAll")}</p>
                            </div>

                            <Categories ref={this.topCategories} title={t("redemption.categories")} seeAllAction={this.displaySeeAll}/>
                            <br/> <br/>

                            {JustForYou.length === 0 && TopRewards === 0 ?
                                <Empty image={emptyRewards} text={t("redemption.emptyRewards")}/>
                                :
                                <div>

                                    <div className="clearfix mb-3">
                                        <p className="text_grey font-weight-bold float-left">{t("redemption.justForYou")}</p>

                                        <p className="small text_grey font-weight-bold float-right" onClick={() => {
                                            this.displaySeeAll('Just For You', '');
                                        }} style={{cursor: "pointer"}}>{t("redemption.seeAll")}</p>
                                    </div>

                                    <Products title={'JustForYou'} updateHistoryData={this.updateHistoryData.bind(this)} 
                                        ref={this.JustForYouRef}
                                        updateWishlistData={this.updateWishlistData.bind(this)} 
                                        justForYouCount={this.justForYouCount.bind(this)} key={1} 
                                    />
                                    <br/>

                                    <div className="clearfix mb-3">
                                        <p className="text_grey font-weight-bold float-left">{t("redemption.topRewards")}</p>

                                        <p className="small text_grey font-weight-bold float-right" onClick={() => {
                                            this.displaySeeAll('Top Rewards', '');
                                        }} style={{cursor: "pointer"}}>{t("redemption.seeAll")}</p>
                                    </div>

                                    <Products title={'TopRewards'} 
                                              ref={this.TopRewardsRef}
                                              featuredCount={this.featuredCount.bind(this)}
                                              topRewardsCount={this.topRewardsCount.bind(this)} key={2}
                                              updateHistoryData={this.updateHistoryData.bind(this)} 
                                              updateWishlistData={this.updateWishlistData.bind(this)}
                                    />
                                </div>
                            }

                        </div>

                        <div className="tab-pane fade" id="nav-history" role="tabpanel"
                             aria-labelledby="nav-history-tab">

                            <History ref={this.historyChild} historycount={this.historyCount.bind(this)} setLoader={this.setLoader}/>

                        </div>

                        <div className="tab-pane fade" id="nav-wishlist" role="tabpanel"
                             aria-labelledby="nav-wishlist-tab">
                            {
                                <Wishlist ref={this.wishlistChild} wishListCount={this.wishListCount.bind(this)}
                                    updateHistoryData={this.updateHistoryData.bind(this)}
                                />
                            }
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    displaySeeAll(title, item) {
        this.navigateTo(title, item);
    }

    featuredCount(count){
        this.setState({
            featuredCount: count
        });
    }

    wishListCount(count){
        this.setState({
            wishListCount: count
        });
    }

    justForYouCount(response){
        this.setState({
            JustForYou: response
        });
    }

    topRewardsCount(response){
        this.setState({
            TopRewards: response
        });
    }

    historyCount(count){
        this.setState({
            historyCount: count
        });
    }
}

export default withTranslation('translation')(withRouter(Redemption));
