import React from 'react';
import {withRouter} from 'react-router-dom';
import LocalizedStrings from "react-localization";
import { localizedStrings } from '../../language/localizedStrings';
import BackButtonIcon from '../../assets/icons/navIcons/ic_refund.png';
import ImageUtils from '../../components/Utils/ImageUtils/ImageUtils';
import $ from 'jquery';
import Form from 'react-bootstrap/Form';
import Empty from "../../components/Utils/Empty/Empty";
import emptyFeedback from '../../assets/images/empty/feedback.svg';
import {Api} from '../../api/Api';
import GetAPIHeader from '../../api/ApiCaller';
import ErrorHandling from '../../api/ErrorHandling';
import Loading from '../../components/Loading/loading';
import StorageUtils from '../../containers/utils/StorageUtils';

const Storage = new StorageUtils();
class TeamList extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            language: "en",
            tableHeader: [
                "Employee Name",
                "Level",
                "Department",
                "Avg Rating",
              ],
           teamList: [],
           notFilterd: [],
           name: '',
           highPerformersArr: [],
           lowPerformersArr: [],
           loading: 0,
        }
    }

    setDataTable() {
        $(document).ready(() => {
            $('a[data-toggle="tab"]').on( 'shown.bs.tab', (e) => {
                $($.fn.dataTable.tables( true )).css('width', '100%');
                $($.fn.dataTable.tables( true )).DataTable().columns.adjust().draw(); 
            });
            let ManagerTable = $('#managerTable').dataTable({
                "paging":   false,
                "info":     false,
                "columnDefs": [{
                  "targets": 3,
                  "orderable": false,
                  "width": "25%",
                },{
                  "targets": 2,
                  "width": "25%",
                },{
                  "targets": 1,
                  "width": "25%",
                },{
                  "targets": 0,
                  "width": "25%",
                }],
                "ordering": true,
                "ordering": true,
                "language": {
                    "search": "_INPUT_",           
                    "searchPlaceholder": "Search Locations..."
                }
            });
            $("#avilableGigsSearch").keyup(function () {
                ManagerTable.search($(this).val()).draw();
            });
        });
    }
    componentDidMount(){
        this.setDataTable.bind(this)
        if(this.props.location.state != undefined && this.props.location.state != null){
            this.getAllSubordinatesPerformances(this.props.location.state.filterVal);
            this.setState({name: this.props.location.state.Name,
                            notFilterd: this.props.location.state.teamList});
        } 
    }
    getAllSubordinatesPerformances(type){
        this.setState({loading: 1});
        new Api(GetAPIHeader(Storage.getAccessToken())).v31.getAllSubordinatesPerformances({type: type})
            .then(response=>{
                if(response.Result.length > 0){
                this.setState({loading: 0});
                response.Result.map(eachFeedback=>{
                        if(eachFeedback.AvgRating > 3.01 && this.state.name === 'High Performers'){
                                this.state.highPerformersArr.push(eachFeedback);
                                const sortedHighPerformence = this.state.highPerformersArr.sort((a,b) => (a.AvgRating < b.AvgRating) ? 1 : ((b.AvgRating < a.AvgRating) ? -1 : 0)); 
                                this.setState({teamList: sortedHighPerformence})
                        } else if((eachFeedback.AvgRating < 3.0 || eachFeedback.AvgRating === 3.0) && this.state.name === 'Needs Intervention'){
                                this.state.lowPerformersArr.push(eachFeedback)
                                const sortedLowPerformence = this.state.lowPerformersArr.sort((a,b) => (a.AvgRating > b.AvgRating) ? 1 : ((b.AvgRating > a.AvgRating) ? -1 : 0)); 
                                this.setState({teamList: sortedLowPerformence});
                        }    
                    }) 
                }
            }).catch((err) => {				ErrorHandling(err)
                this.setState({loading: 0});
            });
    }
    renderTeamList() {
        let strings = new LocalizedStrings(localizedStrings);
        strings.setLanguage(this.state.language);
        const {tableHeader, teamList} = this.state
        return(
            <div>
                <div class="d-flex flex-row-reverse mt-n5">
                </div>
                <div className="row mt-4">
                {teamList.length> 0 ?
                    <div className="col-md-12">
                        <div className="table table-responsive-md table-responsive-lg table-responsive-sm table-responsive table-borderless">
                            <table
                            className="table dt-responsive nowrap"
                            id="managerTable"
                            style={{ fontSize: "14px", width:'100%', border:'0'}}
                            >
                            <thead>
                                <tr>
                                {tableHeader &&
                                    tableHeader.length > 0 &&
                                    tableHeader.map((item) => {
                                    return (
                                        <th
                                        scope="col"
                                        className= "text-truncate small text-gray font-weight-bold pt-5"
                                        style={{display: (item === "Department" && teamList[0].Subordinates.Department === null)? 'none': (item==="Level" && teamList[0].DisplayUnitTypeName===null && teamList[0].Level===null)?'none' :''}}
                                        >
                                        {(item === "Employee Name")?item:(item==="Level")? teamList[0].DisplayUnitTypeName:(item==="Department")?teamList[0].Subordinates.DepartmentDisplayName:(item==="Avg Rating")?item :null}
                                        
                                        </th>
                                    );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {teamList.map(eachItem=>
                                    <tr className="bg-white">
                                    <td className="pl-3 pb-2 pt-3 table-text-size font-weight-light pr-0" style={{width: eachItem.Subordinates.Department !== null ? '30%': '40%'}}>
                                        <div className="row pointer" onClick= {() => this.props.history.push('/teamMemProfile', {userDetails: eachItem})}>
                                            <div className="col-2 " >
                                                <ImageUtils src={   eachItem.Subordinates !== null && 
                                                                eachItem.Subordinates.ImageUrl} width={30} height={30} 
                                                                name={eachItem.Subordinates.FullName} className="mr-2 mt-1"/>
                                            </div>
                                            <div className="col-7 pr-0 pl-lg-3 pl-md-4 pl-sm-4 pl-3">
                                            <p className="normal font-weight-bold multi-line-truncate" style={{WebkitLineClamp : 2}}>{eachItem.Subordinates !== null && eachItem.Subordinates.FullName}</p>
                                                <p className="small text-gray multi-line-truncate" style={{WebkitLineClamp : 2}}>{eachItem.Subordinates !== null && eachItem.Subordinates.Position}</p>
                                            </div>
                                        </div>
                                        </td>
                                        {teamList[0].DisplayUnitTypeName!==null && teamList[0].Level!==null &&
                                    <td className="pl-lg-3 pl-md-3 pl-sm-3 pl-1 pr-0 pb-2 pt-3 table-text-size font-weight-light" style={{width: eachItem.Subordinates.Department !== null ? '25%': '30%'}}>
                                        <p className="multi-line-truncate small font-weight-bold" style={{WebkitLineClamp : 2}}>{eachItem.Level}</p></td>}
                                    {eachItem.Subordinates.Department !== null &&
                                    <td className="pl-lg-3 pl-md-3 pl-sm-3 pl-0 pr-0 pb-2 pt-3 table-text-size font-weight-light" style={{width: eachItem.Subordinates.Department !== null ? '15%': '30%'}}>
                                    <p className="multi-line-truncate small font-weight-bold" style={{WebkitLineClamp : 2}}>{eachItem.Subordinates !== null && eachItem.Subordinates.Department}</p></td>}
                                    <td className="pl-lg-3 pl-md-3 pl-sm-3 pl-0 pr-0 pb-2 pt-3 table-text-size font-weight-light" style={{width: eachItem.Subordinates.Department !== null ? '22%': '30%'}}>
                                        <span className={ eachItem.AvgRating < 2.99 || eachItem.AvgRating === 2.99 ? "app-blue-badge-pill bg-light-red text-red small":
                                                            eachItem.AvgRating < 3.99 || eachItem.AvgRating === 3.99 ? "app-blue-badge-pill bg-light-orange text-orange small" :
                                                        "app-blue-badge-pill bg-light-green text-green small"}>{eachItem.AvgRating} <i class="fa fa-star mr-1" aria-hidden="true"></i></span></td>
                                    </tr> )}
                            </tbody>
                            </table>
                        </div>
                    </div> :
                    <Empty image={emptyFeedback} text={strings.feedback.emptyManagerPrimary} secondaryText={strings.feedback.emptyManagerSecondary}/>}
                </div>
            </div>
        )
      }
    render() {
        let strings = new LocalizedStrings(localizedStrings);
        strings.setLanguage(this.state.language);
        return (
            <React.Fragment>
            <div className="container mt-2">
                <div className="text-left pl-n4 pb-2">
                    <img className="backIcon text_grey pointer" src={BackButtonIcon} onClick={() => this.props.history.goBack()}/>
                    <span className="font-weight-bold text-gray">{' '}{'Back'}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                    <p className="normal font-weight-bold">{this.state.name}</p>
                </div>
                {this.state.loading ? <Loading/> : <>
                <div className="row">
                    <div className="col-md-12">
                        
                <div className="dvSetCompanyGoalsSearch">
                        <Form.Control onChange={(data) => {
                            if (data.target.value === '') {
                                this.setState({teamList: this.state.notFilterd})
                            }
                            else {
                                let filterdData = this.state.notFilterd.filter((item) =>  
                                item.Subordinates.FullName !== null && (item.Subordinates.FullName).toLowerCase().includes((data.target.value).toLowerCase()) || 
                                item.Subordinates.Position !== null && (item.Subordinates.Position).toLowerCase().includes((data.target.value).toLowerCase()) ||
                                item.Level !== null && (item.Level).toLowerCase().includes((data.target.value).toLowerCase()) ||
                                item.Subordinates.Department !== null && (item.Subordinates.Department !== null && (item.Subordinates.Department).toLowerCase()).includes((data.target.value).toLowerCase()))
                                this.setState({teamList: filterdData})
                            }
                        }} />
                    </div>
                    </div>
                </div>
                <div>
                    {this.renderTeamList()}
                </div>
                </>}
            </div>
            </React.Fragment>
        )
    }
}

export default withRouter(TeamList);
