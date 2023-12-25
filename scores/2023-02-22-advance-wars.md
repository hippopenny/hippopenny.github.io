---
title: HippoPenny Score
layout: default
permalink: /meta-score/advance-wars
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
  flex: 1; /* Đưa phần tử này tự mở rộng để chiếm hết không gian còn lại */
  border: 20px solid black; /* Thêm viền màu đen có độ rộng là 10px xung quanh phần tử */
  box-sizing: border-box; 
  margin-right: 10px;
   margin-left:50px ;
  
  
}

.right {
 flex: 1;
  text-align: left; /* Đặt vị trí của nội dung về bên trái */
  align-self: flex-start; /* Đặt vị trí của phần tử "right" ở trên cùng */
  text-transform: uppercase; /* Chuyển đổi chữ thành in hoa */
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

    .critic-box
     {
      /* Thêm kiểu chữ, màu sắc, padding, margin, v.v. */
      font-family: Arial, sans-serif;
      font-size: 16px;
      color: #333;
      padding: 5px;
      margin-right: 10px;
      
      /* Các thuộc tính khác tùy thuộc vào thiết kế của bạn */
    }

    .score-box {
      /* Tương tự, thêm kiểu chữ, màu sắc, padding, margin, v.v. */
      font-family: Arial, sans-serif;
      font-size: 14px;
      color: #777;
      background-color: #e0e0e0;
      padding: 8px;
      
       border-radius: 10px; /* Điều chỉnh giá trị để bo tròn góc */
      /* Các thuộc tính khác tùy thuộc vào thiết kế của bạn */
    }
     .comment-box{
      margin-top:10px;
      background-color: #f0f0f0; /* Màu nền cho ví dụ */
      box-sizing: border-box; /* Đảm bảo padding không làm thay đổi kích thước */
      font-size: 12px;
    }

    .middler{
      width:70%;
      margin: 5%;
      border-top: 1px solid #ccc; /* Đường viền dưới mỗi score-box */
    }
      .box-outer {
        display: flex;
        max-width: 1200px; /* Đặt giới hạn chiều rộng tối đa */
       flex-wrap: wrap;
       
    }

    .box-middle {
        display: flex;
        flex-wrap: wrap;
        gap: 20px; /* Khoảng cách giữa các card */
    }
 .score-critic-container {
        display: flex;
        flex-wrap: wrap;
    }
    .card {
      max-width:29%;
      flex-wrap: wrap;
        border: 1px solid #ccc;
        border-radius: 8px; /* Bo góc */
        padding: 10px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        margin: 10px 20px
    }

    .critic-box-middle {
        font-size: 24px;
        padding: 10px;
    }

    .score-box-middle {
        font-size: 18px;
        padding: 8px;
        color: #777;
        background-color: #e0e0e0;
        border-radius: 10px;
        font-size:24px; 
    }

    .comment-box-middle {
        font-size: 16px;
        padding: 6px;
    }
    .under{
      border-top: 1px solid #ccc;
    }
      .card-under {
      min-width:34%;
      flex-wrap: wrap;
        border: 1px solid #ccc;
        border-radius: 8px; /* Bo góc */
        padding: 10px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        margin: 10px 20px
    }
</style>

{% capture dataFileName %}{{  page.name | replace: '.md', '' | slice: 11, page.name.size  }}{% endcapture %}
{% assign jsonData = site.data[dataFileName] %}

<p id="loadobj" class="load" >{{jsonData}}</p>
<script>
var dataString  = document.getElementById("loadobj").innerText
var replacedString = dataString.replace(/=>/g, ":");
var objects = replacedString.match(/\{.*?\}/g);
var dataArray = objects.map(obj => JSON.parse(obj));


</script>



<div>

 <div class="gallery-item">
    <div class="top">
      <div class="left">
        <img src="/scores/{{ page.name | replace: '.md', '.png' }}" alt="{{ file.name | remove: '.png' | replace: '-', ' ' }}"/>
      </div> 
       <div class="right">
       <div style=" font-size: 48px;padding:10px">{{  page.name | replace: '.md', '' | slice: 11, page.name.size  | replace: '-', ' '   }}</div> 
       <!--  -->
       <div class="critic-score-container">
       <div id="critic-box1" class="critic-box" style=" font-size: 24px;padding:10px">...</div>
       <div id="score-box1" class="score-box" style=" font-size: 24px;padding:10px">...</div>
       <div id="comment-box1"  class="comment-box">...</div>
      </div> 
      <div class="critic-score-container">
       <div id="critic-box2"  class="critic-box" style=" font-size: 24px;padding:10px">...</div>
       <div id="score-box2"  class="score-box" style=" font-size: 24px;padding:10px">...</div>
       <div id="comment-box2" class="comment-box">...</div>
      </div> 
      <div class="critic-score-container">
       <div id="critic-box3"  class="critic-box" style=" font-size: 24px;padding:10px">...</div>
       <div id="score-box3"  class="score-box" style=" font-size: 24px;padding:10px">...</div>
       <div id="comment-box3" class="comment-box">...</div>
      </div> 
      </div> 
    <div>
    </div>
    </div>
<!-- end top -->
    <div class="middler">
   <div class="box-outer">
   <!-- card1 -->
    <div class="card">
    <div class="score-critic-container">
        <div id="score-box-middle1" class="score-box-middle"></div>
        <div id="critic-box-middle1" class="critic-box-middle"></div>
    </div>
    <div id="comment-box-middle1" class="comment-box-middle"></div>
    </div>
    <!-- card2 -->
        <div class="card">
    <div class="score-critic-container">
        <div  id="score-box-middle2"   class="score-box-middle"></div>
        <div id="critic-box-middle2" class="critic-box-middle"></div>
    </div>
    <div id="comment-box-middle2" class="comment-box-middle"></div>
    </div>
    <!--card3  -->
        <div class="card">
    <div class="score-critic-container">
        <div  id="score-box-middle3" class="score-box-middle"></div>
         <div id="critic-box-middle3" class="critic-box-middle"></div>
    </div>
       <div id="comment-box-middle3" class="comment-box-middle"></div>
    </div>
       <!--card4  -->
        <div class="card">
    <div class="score-critic-container">
        <div  id="score-box-middle4" class="score-box-middle"></div>
         <div id="critic-box-middle4" class="critic-box-middle"></div>
    </div>
       <div id="comment-box-middle4" class="comment-box-middle"></div>
    </div>
       <!--card5  -->
        <div class="card">
    <div class="score-critic-container">
        <div  id="score-box-middle5" class="score-box-middle"></div>
         <div id="critic-box-middle5" class="critic-box-middle"></div>
    </div>
       <div id="comment-box-middle5" class="comment-box-middle"></div>
    </div>
       <!--card6  -->
        <div class="card">
    <div class="score-critic-container">
        <div  id="score-box-middle6" class="score-box-middle"></div>
         <div id="critic-box-middle6" class="critic-box-middle"></div>
    </div>
       <div id="comment-box-middle6" class="comment-box-middle"></div>
    </div>
           <!--card7  -->
        <div class="card">
    <div class="score-critic-container">
        <div  id="score-box-middle7" class="score-box-middle"></div>
         <div id="critic-box-middle7" class="critic-box-middle"></div>
    </div>
       <div id="comment-box-middle7" class="comment-box-middle"></div>
    </div>
           <!--card8  -->
        <div class="card">
    <div class="score-critic-container">
        <div  id="score-box-middle8" class="score-box-middle"></div>
         <div id="critic-box-middle8" class="critic-box-middle"></div>
    </div>
       <div id="comment-box-middle8" class="comment-box-middle"></div>
    </div>
           <!--card9  -->
        <div class="card">
    <div class="score-critic-container">
        <div  id="score-box-middle9" class="score-box-middle"></div>
         <div id="critic-box-middle9" class="critic-box-middle"></div>
    </div>
       <div id="comment-box-middle9" class="comment-box-middle"></div>
    </div>
    <!-- end card -->
    </div>
    </div>
    <!--  -->
    <div class="under">
     <div class="card-under">
    <div class="score-critic-container">
        <div  id="score-box-middle10" class="score-box-middle"></div>
         <div id="critic-box-middle10" class="critic-box-middle"></div>
    </div>
       <div id="comment-box-middle10" class="comment-box-middle"></div>
    </div>
     <div class="card-under">
    <div class="score-critic-container">
        <div  id="score-box-middle11" class="score-box-middle"></div>
         <div id="critic-box-middle11" class="critic-box-middle"></div>
    </div>
       <div id="comment-box-middle11" class="comment-box-middle"></div>
    </div>
     <div class="card-under">
    <div class="score-critic-container">
        <div  id="score-box-middle12" class="score-box-middle"></div>
         <div id="critic-box-middle12" class="critic-box-middle"></div>
    </div>
       <div id="comment-box-middle12" class="comment-box-middle"></div>
    </div>
    <div class="card-under">
    <div class="score-critic-container">
        <div  id="score-box-middle13" class="score-box-middle"></div>
         <div id="critic-box-middle13" class="critic-box-middle"></div>
    </div>
       <div id="comment-box-middle13" class="comment-box-middle"></div>
    </div>
    <div class="card-under">
    <div class="score-critic-container">
        <div  id="score-box-middle14" class="score-box-middle"></div>
         <div id="critic-box-middle14" class="critic-box-middle"></div>
    </div>
       <div id="comment-box-middle14" class="comment-box-middle"></div>
    </div>
    <div class="card-under">
    <div class="score-critic-container">
        <div  id="score-box-middle15" class="score-box-middle"></div>
         <div id="critic-box-middle15" class="critic-box-middle"></div>
    </div>
       <div id="comment-box-middle15" class="comment-box-middle"></div>
    </div>
    </div>        
          

<script>
for(let i = 1 ; i <= 3 ; i++){
 document.getElementById(`critic-box${i}`).innerText = `${dataArray[i-1].Critic}`
 document.getElementById(`score-box${i}`).innerText = `${dataArray[i-1].Score}`
 document.getElementById(`comment-box${i}`).innerText = `${dataArray[i-1].Comment}`
}
for(let i = 1 ; i <= 15 ; i++){
 document.getElementById(`critic-box-middle${i}`).innerText = `${dataArray[i+3].Critic}`
 document.getElementById(`score-box-middle${i}`).innerText = `${dataArray[i+3].Score}`
 document.getElementById(`comment-box-middle${i}`).innerText = `${dataArray[i+3].Comment}`
}


</script>

</div>

