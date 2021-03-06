workflow "Install and Publish" {
  on = "push"
  resolves = ["Publish"]
}

# Install dependencies
action "Install" {
  uses = "actions/npm@master"
  args = "install"
}

# Filter for a new tag
action "Tag" {
  needs = "Install"
  uses = "actions/bin/filter@master"
  args = "tag"
}

action "Publish" {
  needs = "Tag"
  uses = "actions/npm@master"
  args = "publish --access public"
  secrets = ["NPM_AUTH_TOKEN"]
}
