---
title: HippoPenny Score
layout: default
permalink: /meta-score/alan-wake-ii
show_excerpts: true
sort_order: reverse
sort_by: date
author_profile: false
---

<style>
  .top {
  display: flex;
  align-items: center; /* Căn giữa theo chiều dọc */
  max-width:99%;
  
}

.left {
  
  border: 20px solid black; /* Thêm viền màu đen có độ rộng là 10px xung quanh phần tử */
  box-sizing: border-box; 
  margin-left:50px ;
  
  
}

.right {
 flex: 1;
  text-align: left; /* Đặt vị trí của nội dung về bên trái */
  align-self: flex-start; /* Đặt vị trí của phần tử "right" ở trên cùng */
   /* Chuyển đổi chữ thành in hoa */
  font-size: 20px; /* Đặt cỡ chữ là 20px, bạn có thể điều chỉnh giá trị theo ý muốn */
   margin-left:30px ;
   

}
.load{
  display :none;
}
   .critic-score-container{
      display: flex;
      flex-wrap: wrap;
      margin-left:5%;
      border-bottom: 1px solid #ccc; /* Đường viền dưới mỗi score-box */
      padding-bottom: 5px; /* Khoảng cách giữa score-box và đường viền */
      margin-bottom: 5px; /* Khoảng cách giữa các phần tử */
    }
  .namegame{
    font-size: 48px;
      margin-right: 10px;
      text-transform: uppercase;


  }
    .critic-box
     {
      /* Thêm kiểu chữ, màu sắc, padding, margin, v.v. */
      font-family: Arial, sans-serif;
      font-size: 16px;
      color: #333;
      padding: 5px;
      margin-right: 10px;
       font-size: 24px;padding:10px
      
      /* Các thuộc tính khác tùy thuộc vào thiết kế của bạn */
    }

    .score-box {
      /* Tương tự, thêm kiểu chữ, màu sắc, padding, margin, v.v. */
      font-family: Arial, sans-serif;
      font-size: 24px;
     background-color: #00ff7c;
    padding: 20px 20px;
      border-radius: 10px; /* Điều chỉnh giá trị để bo tròn góc */

    }
     .comment-box{
      margin-top:10px;
      background-color: #f0f0f0; /* Màu nền cho ví dụ */
      box-sizing: border-box; /* Đảm bảo padding không làm thay đổi kích thước */
      font-size: 14px;
    }
.flex-container {
    display: flex; /* Sử dụng Flexbox cho container */
}

/* Style cho phần tử div đầu tiên */
.flex-container > div:first-child {
    /* CSS cho div đầu tiên */
}

/* Style cho phần tử div thứ hai */
.flex-container > div:last-child {
    /* CSS cho div thứ hai */
}
.caption-container {
   display: flex;
}

#score-box1 {
      color: black;
    font-size: 22px;
     margin-left:5px;
}



@media only screen and (max-width: 800px) {
 .namegame {
    font-size: 18px;
    margin-right: 10px;
}
.right {
   
    margin: 0
}
.left {
  margin : 0;
  border: 3px solid black;
  
}
.top {width: 100%;display: block;}
.flex-container {
    margin-top: 10px;
    margin-left: 10px;
}
.comment-box {
    margin-top: 10px;
    margin-right: 10px;
  
}
.score-box {margin-left:10px;padding: 3px 0px; border-radius: 3px;}
#score-box1{
      font-size: 12px;
}

}


 

</style>

{% capture dataFileName %}{{  page.name | replace: '.md', '' | slice: 11, page.name.size   }}{% endcapture %}
{% assign jsonData = site.data[dataFileName] %}



<div>

 <div class="">
    <div class="top">
      <div class="left">
        <img src="/scores/{{ page.name | replace: '.md', '.png' }}" alt="{{ file.name | remove: '.png' | replace: '-', ' ' }}"/>
      </div> 
       <div class="right">
      <div class="flex-container">
    <div class="namegame" >
        {{ page.name | replace: '.md', '' | slice: 11, page.name.size | replace: '-', ' ' }}
    </div>
</div>
       <!--  -->
     <div class="caption-container">
        <div id="score-box" class="score-box" >
        {{ jsonData.meta-review.score | round % }}
     </div>
    <p id="score-box1" >...</p>
  </div>
       <div class="critic-score-container">
       <div id="comment-box1"  class="comment-box">{{jsonData.meta-review.comment}}</div>
       <div id="critic-box1" class="critic-box" >{{jsonData.meta-review.review-date}}</div>
      </div> 
      </div> 
    <div>
    </div>
    </div>
</div>

<script>

 
    const score = document.getElementById(`score-box`).textContent
    if(score > 90){
      document.getElementById(`score-box1`).innerHTML = "Universal Acclaim"
    }else{
      if(score > 70){
        document.getElementById(`score-box1`).innerHTML = "Generally Favorable"
      }else{
           document.getElementById(`score-box1`).innerHTML  = "Mixed or Average"
      }
    }
  

</script>
