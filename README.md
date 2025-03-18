# Water trekkie gov
 gov demo



cd team5-water-trekkies-main
cd my-frontend
cd my-backend


for branch in $(git branch -r | grep -v '\->'); do
    git branch --track "${branch#origin/}" "$branch"
done
git fetch --all
for branch in $(git branch -r grep -v '\->'); do
    git branch --track "${branch#origin/}" "$branch"
done
git fetch --all