export const invalidateKeys = (queryClient, keys) => {
  keys.forEach((queryKey) => {
    queryClient.invalidateQueries({ queryKey });
  });
};

export const invalidateProjectData = (queryClient) => {
  invalidateKeys(queryClient, [["projects"], ["ranking"], ["delivery"]]);
};

export const invalidateOrgData = (queryClient) => {
  invalidateKeys(queryClient, [
    ["serviceLines"],
    ["teams"],
    ["users"],
    ["ranking"],
    ["delivery"],
    ["projects"],
  ]);
};

export const invalidateUserData = (queryClient) => {
  invalidateKeys(queryClient, [["users"], ["ranking"], ["projects"]]);
};

export const invalidateDeliveryData = (queryClient) => {
  invalidateKeys(queryClient, [["delivery"], ["ranking"]]);
};

export const invalidateProfileData = (queryClient) => {
  invalidateKeys(queryClient, [["user", "me"], ["users"], ["ranking"]]);
};
