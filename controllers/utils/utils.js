function orderArray(array, order, key) {
  array.sort(function (a, b) {
    let A = a[key]
    let B = b[key];

    if (order.indexOf(A) > order.indexOf(B)) {
      return 1;
    } else {
      return -1;
    }

  });

  return array;
}

function isAdmin(startParams) {
  return startParams.vk_viewer_group_role && startParams.vk_viewer_group_role === 'admin';
};

function getImageUrl(imageId) {
  return process.env.S3_BUCKET_URL + imageId;
}

module.exports = { orderArray, isAdmin, getImageUrl }